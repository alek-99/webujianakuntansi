
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status_aktif")
      .eq("id", user.id)
      .single();

    if (
      profile?.role !== "siswa" ||
      profile?.status_aktif !== true
    ) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { data: soal, error } = await supabase
      .from("bank_soal")
      .select(`
        id,
        judul,
        deskripsi,
        mata_pelajaran,
        materi,
        nama_barang,
        kode_barang,
        metode_persediaan,
        metode_penilaian,
        saldo_awal_qty,
        saldo_awal_harga,
        tingkat_kesulitan,
        bank_soal_transaksi (
          id,
          urutan,
          tanggal,
          keterangan,
          jenis_transaksi,
          jumlah,
          harga_satuan
        )
      `)
      .eq("id", id)
      .eq("status", "aktif")
      .single();

    if (error || !soal) {
      return NextResponse.json(
        { message: "Bank soal tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data: pengerjaan } = await supabase
      .from("bank_soal_pengerjaan")
      .select("id, nilai, submitted_at")
      .eq("bank_soal_id", id)
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (pengerjaan) {
      return NextResponse.json({
        data: {
          ...soal,
          bank_soal_transaksi: soal.bank_soal_transaksi.sort(
            (a, b) => a.urutan - b.urutan
          ),
          sudah_dikerjakan: true,
          hasil: pengerjaan,
        },
      });
    }

    return NextResponse.json({
      data: {
        ...soal,
        bank_soal_transaksi: soal.bank_soal_transaksi.sort(
          (a, b) => a.urutan - b.urutan
        ),
        sudah_dikerjakan: false,
        hasil: null,
      },
    });
  } catch (error) {
    console.error("GET DETAIL BANK SOAL:", error);

    return NextResponse.json(
      { message: "Gagal mengambil detail soal." },
      { status: 500 }
    );
  }
}

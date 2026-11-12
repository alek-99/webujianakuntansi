
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, status_aktif")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "guru" || !profile.status_aktif) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    // Ambil pengerjaan siswa
    const { data: pengerjaan, error: pengerjaanError } =
      await supabase
        .from("bank_soal_pengerjaan")
        .select("*")
        .eq("id", id)
        .single();

    if (pengerjaanError || !pengerjaan) {
      return NextResponse.json(
        { message: "Data pengerjaan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan bank soal adalah milik guru yang login
    const { data: soal, error: soalError } = await supabase
      .from("bank_soal")
      .select("*")
      .eq("id", pengerjaan.bank_soal_id)
      .eq("guru_id", user.id)
      .single();

    if (soalError || !soal) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke hasil ini." },
        { status: 403 }
      );
    }

    // Profil siswa
    const { data: siswa, error: siswaError } = await supabase
      .from("profiles")
      .select("id, nama, nis")
      .eq("id", pengerjaan.siswa_id)
      .single();

    if (siswaError) throw siswaError;

    // Transaksi dalam soal
    const { data: transaksi, error: transaksiError } =
      await supabase
        .from("bank_soal_transaksi")
        .select("*")
        .eq("bank_soal_id", soal.id)
        .order("urutan", { ascending: true });

    if (transaksiError) throw transaksiError;

    const transaksiIds = (transaksi ?? []).map((item) => item.id);

    // Jawaban siswa
    const { data: jawaban, error: jawabanError } =
      await supabase
        .from("bank_soal_jawaban_detail")
        .select("*")
        .eq("pengerjaan_id", pengerjaan.id);

    if (jawabanError) throw jawabanError;

    // Kunci jawaban dan bobot
    let kunci: {
      transaksi_id: string;
      field_key: string;
      nilai_benar: string | number | null;
      bobot: number;
      toleransi: number | null;
    }[] = [];

    if (transaksiIds.length > 0) {
      const { data, error } = await supabase
        .from("bank_soal_kunci_detail")
        .select("transaksi_id, field_key, nilai_benar, bobot, toleransi")
        .in("transaksi_id", transaksiIds);

      if (error) throw error;
      kunci = data ?? [];
    }

    const detail = (transaksi ?? []).map((item) => ({
      ...item,
      jawaban: (jawaban ?? []).filter(
        (j) => j.transaksi_id === item.id
      ),
      kunci: kunci.filter(
        (k) => k.transaksi_id === item.id
      ),
    }));

    return NextResponse.json({
      data: {
        pengerjaan,
        soal,
        siswa,
        transaksi: detail,
      },
    });
  } catch (error) {
    console.error("GET DETAIL HASIL BANK SOAL:", error);

    return NextResponse.json(
      { message: "Gagal mengambil detail jawaban siswa." },
      { status: 500 }
    );
  }
}

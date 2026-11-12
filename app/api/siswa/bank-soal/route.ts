
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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
        { message: "Akses hanya untuk siswa aktif." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
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
        created_at
      `)
      .eq("status", "aktif")
      .eq("metode_persediaan", "perpetual")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const ids = (data ?? []).map((item) => item.id);

    let pengerjaanIds: string[] = [];

    if (ids.length > 0) {
      const { data: pengerjaan, error: pengerjaanError } =
        await supabase
          .from("bank_soal_pengerjaan")
          .select("bank_soal_id")
          .eq("siswa_id", user.id)
          .in("bank_soal_id", ids);

      if (pengerjaanError) throw pengerjaanError;

      pengerjaanIds = (pengerjaan ?? []).map(
        (item) => item.bank_soal_id
      );
    }

    return NextResponse.json({
      data: (data ?? []).map((item) => ({
        ...item,
        sudah_dikerjakan: pengerjaanIds.includes(item.id),
      })),
    });
  } catch (error) {
    console.error("GET BANK SOAL SISWA:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data bank soal." },
      { status: 500 }
    );
  }
}

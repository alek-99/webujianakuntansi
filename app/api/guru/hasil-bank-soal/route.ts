
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, status_aktif")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "guru" || !profile.status_aktif) {
      return NextResponse.json(
        { message: "Akses hanya untuk guru." },
        { status: 403 }
      );
    }

    // Ambil bank soal milik guru
    const { data: bankSoal, error: soalError } = await supabase
      .from("bank_soal")
      .select("id, judul, mata_pelajaran, materi, status, created_at")
      .eq("guru_id", user.id)
      .order("created_at", { ascending: false });

    if (soalError) throw soalError;

    const soalIds = (bankSoal ?? []).map((soal) => soal.id);

    if (soalIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Ambil seluruh pengerjaan dari bank soal milik guru
    const { data: pengerjaan, error: pengerjaanError } = await supabase
      .from("bank_soal_pengerjaan")
      .select(
        "id, bank_soal_id, siswa_id, status, nilai, jumlah_benar, jumlah_kunci, submitted_at"
      )
      .in("bank_soal_id", soalIds)
      .order("submitted_at", { ascending: false });

    if (pengerjaanError) throw pengerjaanError;

    const siswaIds = [
      ...new Set((pengerjaan ?? []).map((item) => item.siswa_id)),
    ];

    let siswa: { id: string; nama: string; nis: string | null }[] = [];

    if (siswaIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nama, nis")
        .in("id", siswaIds);

      if (error) throw error;
      siswa = data ?? [];
    }

    const hasil = (bankSoal ?? []).map((soal) => {
      const pengerjaanSoal = (pengerjaan ?? [])
        .filter((item) => item.bank_soal_id === soal.id)
        .map((item) => {
          const profilSiswa = siswa.find(
            (s) => s.id === item.siswa_id
          );

          return {
            ...item,
            siswa: profilSiswa ?? {
              id: item.siswa_id,
              nama: "Siswa tidak ditemukan",
              nis: null,
            },
          };
        });

      return {
        ...soal,
        total_pengerjaan: pengerjaanSoal.length,
        rata_rata:
          pengerjaanSoal.length > 0
            ? Number(
                (
                  pengerjaanSoal.reduce(
                    (total, item) => total + Number(item.nilai ?? 0),
                    0
                  ) / pengerjaanSoal.length
                ).toFixed(2)
              )
            : 0,
        pengerjaan: pengerjaanSoal,
      };
    });

    return NextResponse.json({ data: hasil });
  } catch (error) {
    console.error("GET HASIL BANK SOAL:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data hasil pengerjaan." },
      { status: 500 }
    );
  }
}

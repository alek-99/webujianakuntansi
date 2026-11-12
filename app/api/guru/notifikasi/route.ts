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
        { message: "Silakan login." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status_aktif")
      .eq("id", user.id)
      .single();

    if (
      profile?.role !== "guru" ||
      profile?.status_aktif !== true
    ) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("notifikasi_guru")
      .select(`
        id,
        judul,
        pesan,
        tipe,
        is_read,
        created_at,
        whatsapp_status,
        bank_soal_id,
        peserta_id,
        profiles:peserta_id (
          nama
        )
      `)
      .eq("guru_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const belumDibaca =
      data?.filter((item) => !item.is_read).length || 0;

    return NextResponse.json({
      data,
      belumDibaca,
    });
  } catch (error) {
    console.error("GET NOTIFIKASI GURU:", error);

    return NextResponse.json(
      { message: "Gagal mengambil notifikasi." },
      { status: 500 }
    );
  }
}
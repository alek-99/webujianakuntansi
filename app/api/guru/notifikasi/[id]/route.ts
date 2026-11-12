import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(
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
      .update({ is_read: true })
      .eq("id", id)
      .eq("guru_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { message: "Notifikasi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Notifikasi telah dibaca.",
    });
  } catch (error) {
    console.error("READ NOTIFIKASI:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}
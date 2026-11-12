import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Verifikasi role siswa
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nama, role, status_aktif")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      profile.role !== "siswa" ||
      !profile.status_aktif
    ) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const pesertaId = body.peserta_id;

    if (!pesertaId || typeof pesertaId !== "string") {
      return NextResponse.json(
        { success: false, message: "ID peserta tidak valid." },
        { status: 400 }
      );
    }

    // 3. Pengumpulan melalui RPC.
    // Database trigger akan membuat notifikasi otomatis.
    const { error: submitError } = await supabase.rpc(
      "kumpulkan_ujian",
      {
        p_peserta_id: pesertaId,
      }
    );

    if (submitError) {
      console.error("Submit error:", submitError);

      return NextResponse.json(
        {
          success: false,
          message: submitError.message,
        },
        { status: 400 }
      );
    }

    // 4. Cari notifikasi yang baru dibuat.
    const { data: notification, error: notificationError } =
      await admin
        .from("notifikasi_guru")
        .select(`
          id,
          guru_id,
          pesan,
          created_at
        `)
        .eq("peserta_id", pesertaId)
        .eq("tipe", "pengumpulan_ujian")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (notificationError || !notification) {
      console.error("Notification error:", notificationError);

      return NextResponse.json({
        success: true,
        message: "Ujian berhasil dikumpulkan.",
        whatsapp: "notification_not_found",
      });
    }

    // 5. Klaim pengiriman agar request ulang tidak
    // langsung mengirim WhatsApp dua kali.
    const { data: claimed } = await admin
      .from("notifikasi_guru")
      .update({
        whatsapp_status: "processing",
        whatsapp_error: null,
      })
      .eq("id", notification.id)
      .eq("whatsapp_status", "pending")
      .select("id")
      .maybeSingle();

    if (!claimed) {
      return NextResponse.json({
        success: true,
        message: "Ujian berhasil dikumpulkan.",
        whatsapp: "already_processed",
      });
    }

    // 6. Ambil nomor WhatsApp guru.
    const { data: guru } = await admin
      .from("profiles")
      .select("nama, whatsapp")
      .eq("id", notification.guru_id)
      .single();

    if (!guru?.whatsapp) {
      await admin
        .from("notifikasi_guru")
        .update({
          whatsapp_status: "skipped",
          whatsapp_error: "Nomor WhatsApp guru belum tersedia.",
        })
        .eq("id", notification.id);

      return NextResponse.json({
        success: true,
        message: "Ujian berhasil dikumpulkan.",
        whatsapp: "skipped",
      });
    }

    // 7. Susun pesan WhatsApp.
    const message = `
🔔 *NOTIFIKASI PENGUMPULAN UJIAN*

Halo Bapak/Ibu ${guru.nama || "Guru"}.

Ada siswa yang baru saja mengumpulkan ujian.

${notification.pesan}

📅 Waktu: ${new Date(
      notification.created_at
    ).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
      timeStyle: "short",
    })}

Silakan buka dashboard guru untuk melihat jawaban siswa.

_Sistem Ujian Online PPLK_
    `.trim();

    // 8. Kirim WhatsApp menggunakan Fonnte.
    try {
      const formData = new FormData();

      formData.append("target", guru.whatsapp);
      formData.append("message", message);
      formData.append("countryCode", "62");

      const response = await fetch(
        "https://api.fonnte.com/send",
        {
          method: "POST",
          headers: {
            Authorization: process.env.FONNTE_TOKEN!,
          },
          body: formData,
          signal: AbortSignal.timeout(20000),
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== true) {
        throw new Error(
          result.reason || "WhatsApp gagal dikirim."
        );
      }

      // 9. Update status berhasil.
      await admin
        .from("notifikasi_guru")
        .update({
          whatsapp_status: "sent",
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_error: null,
        })
        .eq("id", notification.id);

      return NextResponse.json({
        success: true,
        message: "Ujian berhasil dikumpulkan.",
        whatsapp: "sent",
      });

    } catch (waError) {
      console.error("Fonnte error:", waError);

      await admin
        .from("notifikasi_guru")
        .update({
          whatsapp_status: "failed",
          whatsapp_error:
            waError instanceof Error
              ? waError.message
              : "Gagal mengirim WhatsApp.",
        })
        .eq("id", notification.id);

      return NextResponse.json({
        success: true,
        message: "Ujian berhasil dikumpulkan.",
        whatsapp: "failed",
      });
    }

  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
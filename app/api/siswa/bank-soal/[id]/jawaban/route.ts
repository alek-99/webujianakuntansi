
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ id: string }>;
}

interface JawabanInput {
  transaksi_id: string;
  field_key: string;
  nilai: number;
}

function normalizeWhatsApp(phone: string): string {
  let number = phone.replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "62" + number.slice(1);
  } else if (number.startsWith("8")) {
    number = "62" + number;
  }

  return number;
}

function isValidJawaban(value: unknown): value is JawabanInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every((item) => {
    return (
      item !== null &&
      typeof item === "object" &&
      typeof item.transaksi_id === "string" &&
      item.transaksi_id.trim().length > 0 &&
      typeof item.field_key === "string" &&
      item.field_key.trim().length > 0 &&
      typeof item.nilai === "number" &&
      Number.isFinite(item.nilai)
    );
  });
}

async function sendWhatsApp(
  target: string,
  message: string
): Promise<void> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    throw new Error("Token Fonnte belum dikonfigurasi.");
  }

  const body = new URLSearchParams({
    target,
    message,
  });

  const response = await fetch(
    "https://api.fonnte.com/send",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  const responseText = await response.text();

  let result: {
    status?: boolean;
    reason?: string;
    detail?: string;
  };

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Respons dari layanan WhatsApp tidak valid."
    );
  }

  if (!response.ok || result.status !== true) {
    throw new Error(
      result.reason ||
      result.detail ||
      "Pengiriman WhatsApp gagal."
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    // ==========================================
    // 1. VALIDASI PARAMETER
    // ==========================================

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "ID bank soal tidak valid." },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. VALIDASI AUTENTIKASI
    // ==========================================

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 3. VALIDASI PROFIL SISWA
    // ==========================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, nama, role, status_aktif")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "siswa" ||
      profile.status_aktif !== true
    ) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    // ==========================================
    // 4. VALIDASI BODY REQUEST
    // ==========================================

    let body: { jawaban?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Format request tidak valid." },
        { status: 400 }
      );
    }

    if (!isValidJawaban(body.jawaban)) {
      return NextResponse.json(
        {
          message: "Jawaban belum diisi atau format tidak valid.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. INISIALISASI ADMIN CLIENT
    // ==========================================

    const admin = createAdminClient();

    // ==========================================
    // 6. AMBIL DATA BANK SOAL
    // ==========================================

    const { data: bankSoal, error: soalError } =
      await admin
        .from("bank_soal")
        .select("id, judul, guru_id")
        .eq("id", id)
        .single();

    if (soalError || !bankSoal) {
      return NextResponse.json(
        { message: "Bank soal tidak ditemukan." },
        { status: 404 }
      );
    }

    // ==========================================
    // 7. PROSES PENGUMPULAN JAWABAN
    // ==========================================

    const { data: hasil, error: submitError } =
      await supabase.rpc(
        "submit_bank_soal_jawaban",
        {
          p_bank_soal_id: id,
          p_jawaban: body.jawaban,
        }
      );

    if (submitError) {
      console.error(
        "SUBMIT JAWABAN ERROR:",
        submitError
      );

      return NextResponse.json(
        {
          message:
            submitError.message ||
            "Gagal mengumpulkan jawaban.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 8. SIAPKAN NOTIFIKASI GURU
    // ==========================================

    let notificationWarning: string | null = null;

    try {
      const namaSiswa = profile.nama || "Siswa";
      const judulSoal = bankSoal.judul || "Bank Soal";
      const judulNotifikasi =
        "Jawaban siswa dikumpulkan";
      const pesanNotifikasi =
        `${namaSiswa} telah mengumpulkan jawaban ` +
        `untuk bank soal "${judulSoal}".`;

      const { data: notifikasi, error: notifError } =
        await admin
          .from("notifikasi_guru")
          .insert({
            guru_id: bankSoal.guru_id,
            peserta_id: user.id,
            bank_soal_id: bankSoal.id,
            judul: judulNotifikasi,
            pesan: pesanNotifikasi,
            tipe: "bank_soal",
            is_read: false,
            whatsapp_status: "pending",
            whatsapp_error: null,
          })
          .select("id")
          .single();

      if (notifError || !notifikasi) {
        throw new Error(
          notifError?.message ||
          "Gagal menyimpan notifikasi guru."
        );
      }

      const { data: guru, error: guruError } = await admin
        .from("profiles")
        .select("nama, whatsapp")
        .eq("id", bankSoal.guru_id)
        .single();

      const nomorGuru =
        typeof guru?.whatsapp === "string"
          ? normalizeWhatsApp(guru.whatsapp)
          : "";
      const nomorValid = /^62\d{8,13}$/.test(nomorGuru);

      if (guruError || !guru || !nomorValid) {
        notificationWarning = guruError
          ? "Data guru tidak dapat diambil."
          : "Nomor WhatsApp guru belum tersedia atau tidak valid.";

        if (guruError) {
          console.error("GET GURU NOTIFIKASI ERROR:", guruError);
        }

        const { error: updateError } = await admin
          .from("notifikasi_guru")
          .update({
            whatsapp_status: "skipped",
            whatsapp_error: notificationWarning,
          })
          .eq("id", notifikasi.id);

        if (updateError) {
          console.error("UPDATE WHATSAPP STATUS ERROR:", updateError);
          notificationWarning += " Status WhatsApp gagal diperbarui.";
        }
      } else {
        try {
          const pesanWhatsApp =
            `Halo ${guru.nama || "Guru"},\n\n` +
            `Ada pengumpulan jawaban baru.\n\n` +
            `Nama siswa: ${namaSiswa}\n` +
            `Bank soal: ${judulSoal}\n\n` +
            `Silakan buka dashboard guru untuk memeriksa hasil pengerjaan siswa.`;

          await sendWhatsApp(
            nomorGuru,
            pesanWhatsApp
          );

          // Update status WhatsApp berhasil.
          const { error: updateError } = await admin
            .from("notifikasi_guru")
            .update({
              whatsapp_status: "sent",
              whatsapp_sent_at: new Date().toISOString(),
              whatsapp_error: null,
            })
            .eq("id", notifikasi.id);

          if (updateError) {
            console.error(
              "UPDATE WHATSAPP STATUS ERROR:",
              updateError
            );
            notificationWarning =
              "WhatsApp terkirim, tetapi statusnya gagal diperbarui.";
          }
        } catch (whatsappError) {
          const errorMessage =
            whatsappError instanceof Error
              ? whatsappError.message
              : "Pengiriman WhatsApp gagal.";

          notificationWarning = errorMessage;

          console.error(
            "FONNTE ERROR:",
            whatsappError
          );

          // Simpan status pengiriman gagal.
          const { error: updateError } = await admin
            .from("notifikasi_guru")
            .update({
              whatsapp_status: "failed",
              whatsapp_error: errorMessage,
            })
            .eq("id", notifikasi.id);

          if (updateError) {
            console.error(
              "UPDATE FAILED STATUS ERROR:",
              updateError
            );
            notificationWarning +=
              " Status kegagalan WhatsApp juga gagal diperbarui.";
          }
        }
      }
    } catch (notificationError) {
      notificationWarning =
        notificationError instanceof Error
          ? notificationError.message
          : "Notifikasi guru gagal dibuat.";

      console.error(
        "NOTIFIKASI GURU ERROR:",
        notificationError
      );
    }

    // ==========================================
    // 11. RESPONSE BERHASIL
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message: "Jawaban berhasil dikumpulkan.",
        data: hasil,
        notificationWarning,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "SUBMIT BANK SOAL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengumpulkan jawaban.",
      },
      { status: 500 }
    );
  }
}

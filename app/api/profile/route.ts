
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ==========================================
// GET: MENGAMBIL DATA PROFIL
// ==========================================
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

    const admin = createAdminClient();

    const { data: profile, error } = await admin
      .from("profiles")
      .select(`
        id,
        nama,
        nis,
        nip,
        role,
        jenis_kelamin,
        no_hp,
        alamat,
        avatar_url,
        status_aktif
      `)
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      console.error("GET PROFILE ERROR:", error);

      return NextResponse.json(
        { message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH: MEMPERBARUI DATA PROFIL
// ==========================================
export async function PATCH(request: Request) {
  try {
    // 1. Validasi autentikasi
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

    // 2. Ambil request body
    const body = await request.json();

    const nama =
      typeof body.nama === "string" ? body.nama.trim() : "";

    const nip =
      typeof body.nip === "string" && body.nip.trim()
        ? body.nip.trim()
        : null;

    const jenis_kelamin = body.jenis_kelamin;

    const no_hp =
      typeof body.no_hp === "string" && body.no_hp.trim()
        ? body.no_hp.trim()
        : null;

    const alamat =
      typeof body.alamat === "string" && body.alamat.trim()
        ? body.alamat.trim()
        : null;

    // 3. Validasi nama
    if (nama.length < 2 || nama.length > 100) {
      return NextResponse.json(
        {
          message: "Nama harus terdiri dari 2–100 karakter.",
        },
        { status: 400 }
      );
    }

    // 4. Validasi NIP
    if (nip !== null && nip.length > 30) {
      return NextResponse.json(
        {
          message: "NIP maksimal 30 karakter.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi jenis kelamin
    if (
      jenis_kelamin !== null &&
      jenis_kelamin !== "L" &&
      jenis_kelamin !== "P"
    ) {
      return NextResponse.json(
        { message: "Jenis kelamin tidak valid." },
        { status: 400 }
      );
    }

    // 6. Validasi nomor HP
    if (no_hp !== null && no_hp.length > 20) {
      return NextResponse.json(
        { message: "Nomor HP maksimal 20 karakter." },
        { status: 400 }
      );
    }

    // 7. Validasi alamat
    if (alamat !== null && alamat.length > 500) {
      return NextResponse.json(
        { message: "Alamat maksimal 500 karakter." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 8. Ambil profil pengguna
    const { data: currentProfile, error: profileError } =
      await admin
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    // 9. Siapkan data yang akan diperbarui
    const updateData: {
      nama: string;
      jenis_kelamin: "L" | "P" | null;
      no_hp: string | null;
      alamat: string | null;
      updated_at: string;
      nip?: string | null;
    } = {
      nama,
      jenis_kelamin,
      no_hp,
      alamat,
      updated_at: new Date().toISOString(),
    };

    // 10. NIP hanya dapat diperbarui oleh akun guru
    if (currentProfile.role === "guru") {
      // Periksa apakah NIP sudah digunakan pengguna lain
      if (nip !== null) {
        const { data: existingNip, error: nipError } =
          await admin
            .from("profiles")
            .select("id")
            .eq("nip", nip)
            .neq("id", user.id)
            .maybeSingle();

        if (nipError) {
          console.error("CHECK NIP ERROR:", nipError);

          return NextResponse.json(
            { message: "Gagal memeriksa ketersediaan NIP." },
            { status: 500 }
          );
        }

        if (existingNip) {
          return NextResponse.json(
            {
              message: "NIP sudah digunakan oleh pengguna lain.",
            },
            { status: 409 }
          );
        }
      }

      updateData.nip = nip;
    }

    // 11. Simpan perubahan ke Supabase
    const { data, error } = await admin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select(`
        id,
        nama,
        nis,
        nip,
        role,
        jenis_kelamin,
        no_hp,
        alamat,
        avatar_url,
        status_aktif
      `)
      .single();

    if (error) {
      console.error("UPDATE PROFILE ERROR:", error);

      return NextResponse.json(
        {
          message:
            error.code === "23505"
              ? "NIP sudah digunakan oleh pengguna lain."
              : "Gagal memperbarui profil.",
        },
        {
          status: error.code === "23505" ? 409 : 500,
        }
      );
    }

    // 12. Kembalikan data terbaru
    return NextResponse.json({
      message: "Profil berhasil diperbarui.",
      profile: {
        ...data,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("PATCH PROFILE ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

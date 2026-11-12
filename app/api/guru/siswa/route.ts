import { NextRequest, NextResponse } from "next/server";
import { requireGuru } from "@/lib/auth/require-guru";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// GET: Ambil semua data siswa
export async function GET() {
  try {
    const auth = await requireGuru();

    if (!auth.authorized) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { data: profiles, error } = await auth.admin
      .from("profiles")
      .select(`
        id,
        nama,
        nis,
        jenis_kelamin,
        no_hp,
        alamat,
        status_aktif,
        created_at,
        updated_at
      `)
      .eq("role", "siswa")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Ambil email dari Supabase Auth
    const { data: authUsers, error: usersError } =
      await auth.admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) throw usersError;

    const emailMap = new Map(
      authUsers.users.map((user) => [
        user.id,
        user.email ?? "",
      ])
    );

    const students = (profiles ?? []).map((profile) => ({
      ...profile,
      email: emailMap.get(profile.id) ?? "",
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET STUDENTS:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data siswa." },
      { status: 500 }
    );
  }
}

// POST: Buat akun siswa
export async function POST(request: NextRequest) {
  try {
    const auth = await requireGuru();

    if (!auth.authorized) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();

    const {
      nama,
      email,
      password,
      nis,
      jenis_kelamin,
      no_hp,
      alamat,
    } = body;

    if (
      typeof nama !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof nis !== "string" ||
      !nama.trim() ||
      !email.trim() ||
      !nis.trim() ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        {
          message: "Data tidak valid. Password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    if (
      jenis_kelamin !== "L" &&
      jenis_kelamin !== "P"
    ) {
      return NextResponse.json(
        { message: "Jenis kelamin tidak valid." },
        { status: 400 }
      );
    }

    if (
      (no_hp != null && typeof no_hp !== "string") ||
      (alamat != null && typeof alamat !== "string")
    ) {
      return NextResponse.json(
        { message: "Nomor HP atau alamat tidak valid." },
        { status: 400 }
      );
    }

    // Cek NIS sebelum membuat akun
    const { data: existingNis, error: nisError } = await auth.admin
      .from("profiles")
      .select("id")
      .eq("nis", nis.trim())
      .maybeSingle();

    if (nisError) throw nisError;

    if (existingNis) {
      return NextResponse.json(
        { message: "NIS sudah digunakan." },
        { status: 409 }
      );
    }

    // Buat akun Supabase Auth
    const { data, error } = await auth.admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nama: nama.trim(),
      },
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    // Trigger handle_new_user() otomatis membuat profil
    const { data: profile, error: updateError } = await auth.admin
      .from("profiles")
      .update({
        nama: nama.trim(),
        nis: nis.trim(),
        jenis_kelamin,
        no_hp: no_hp?.trim() || null,
        alamat: alamat?.trim() || null,
        role: "siswa",
        status_aktif: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id)
      .eq("role", "siswa")
      .select("id")
      .single();

    if (updateError || !profile) {
      // Rollback jika penyimpanan profil gagal
      await auth.admin.auth.admin.deleteUser(data.user.id);

      throw updateError ?? new Error("Profil siswa gagal dibuat.");
    }

    return NextResponse.json(
      {
        message: "Akun siswa berhasil dibuat.",
        id: data.user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE STUDENT:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat membuat akun siswa." },
      { status: 500 }
    );
  }
}
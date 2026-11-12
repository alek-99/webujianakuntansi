import { NextRequest, NextResponse } from "next/server";
import { requireGuru } from "@/lib/auth/require-guru";

export const runtime = "nodejs";

// UPDATE SISWA
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireGuru();

    if (!auth.authorized) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      nama,
      nis,
      jenis_kelamin,
      no_hp,
      alamat,
      status_aktif,
      password,
    } = body;

    const { data: existing, error: findError } = await auth.admin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .eq("role", "siswa")
      .maybeSingle();

    if (findError) throw findError;

    if (!existing) {
      return NextResponse.json(
        { message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (
      typeof nama !== "string" ||
      !nama.trim() ||
      typeof nis !== "string" ||
      !nis.trim() ||
      (jenis_kelamin !== "L" && jenis_kelamin !== "P") ||
      typeof status_aktif !== "boolean" ||
      (no_hp != null && typeof no_hp !== "string") ||
      (alamat != null && typeof alamat !== "string")
    ) {
      return NextResponse.json(
        { message: "Data siswa tidak valid." },
        { status: 400 }
      );
    }

    // Cek NIS milik siswa lain
    const { data: duplicate, error: duplicateError } = await auth.admin
      .from("profiles")
      .select("id")
      .eq("nis", nis.trim())
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (duplicate) {
      return NextResponse.json(
        { message: "NIS sudah digunakan siswa lain." },
        { status: 409 }
      );
    }

    // Update profil
    const { error: updateError } = await auth.admin
      .from("profiles")
      .update({
        nama: nama.trim(),
        nis: nis.trim(),
        jenis_kelamin,
        no_hp: no_hp?.trim() || null,
        alamat: alamat?.trim() || null,
        status_aktif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("role", "siswa");

    if (updateError) throw updateError;

    // Update password jika diisi
    if (password !== undefined && password !== "") {
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      ) {
        return NextResponse.json(
          { message: "Password minimal 8 karakter." },
          { status: 400 }
        );
      }

      const { error: passwordError } =
        await auth.admin.auth.admin.updateUserById(id, {
          password,
        });

      if (passwordError) throw passwordError;
    }

    return NextResponse.json({
      message: "Data siswa berhasil diperbarui.",
    });
  } catch (error) {
    console.error("UPDATE STUDENT:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui data siswa." },
      { status: 500 }
    );
  }
}

// DELETE SISWA
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireGuru();

    if (!auth.authorized) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;

    const { data: existing, error: findError } = await auth.admin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .eq("role", "siswa")
      .maybeSingle();

    if (findError) throw findError;

    if (!existing) {
      return NextResponse.json(
        { message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus akun Auth.
    // profiles otomatis terhapus karena ON DELETE CASCADE.
    const { error } = await auth.admin.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({
      message: "Akun siswa berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE STUDENT:", error);

    return NextResponse.json(
      { message: "Gagal menghapus akun siswa." },
      { status: 500 }
    );
  }
}
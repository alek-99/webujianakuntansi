import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File avatar tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Format harus JPG, PNG, atau WEBP." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran avatar maksimal 2 MB." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    const extension = file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";

    // Nama file unik agar browser tidak menggunakan cache gambar lama.
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("AVATAR UPLOAD ERROR:", uploadError);

      return NextResponse.json(
        { message: "Gagal mengunggah avatar." },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      await admin.storage.from("avatars").remove([filePath]);

      return NextResponse.json(
        { message: "Gagal menyimpan URL avatar." },
        { status: 500 }
      );
    }

    // Hapus avatar sebelumnya setelah avatar baru berhasil disimpan.
    if (profile.avatar_url) {
      try {
        const oldUrl = new URL(profile.avatar_url);
        const marker = "/storage/v1/object/public/avatars/";

        const index = oldUrl.pathname.indexOf(marker);

        if (index !== -1) {
          const oldPath = decodeURIComponent(
            oldUrl.pathname.slice(index + marker.length)
          );

          // Hanya hapus file dalam folder milik user sendiri.
          if (oldPath.startsWith(`${user.id}/`)) {
            await admin.storage
              .from("avatars")
              .remove([oldPath]);
          }
        }
      } catch (error) {
        console.error("OLD AVATAR CLEANUP ERROR:", error);
      }
    }

    return NextResponse.json({
      message: "Avatar berhasil diperbarui.",
      avatar_url: publicUrl,
    });
  } catch (error) {
    console.error("AVATAR API ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    if (profile.avatar_url) {
      const oldUrl = new URL(profile.avatar_url);
      const marker = "/storage/v1/object/public/avatars/";
      const index = oldUrl.pathname.indexOf(marker);

      if (index !== -1) {
        const oldPath = decodeURIComponent(
          oldUrl.pathname.slice(index + marker.length)
        );

        if (oldPath.startsWith(`${user.id}/`)) {
          const { error: removeError } = await admin.storage
            .from("avatars")
            .remove([oldPath]);

          if (removeError) {
            console.error("AVATAR DELETE ERROR:", removeError);
          }
        }
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { message: "Gagal menghapus avatar." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Avatar berhasil dihapus.",
      avatar_url: null,
    });
  } catch (error) {
    console.error("DELETE AVATAR ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireGuru() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false as const,
      status: 401,
      message: "Silakan login terlebih dahulu.",
    };
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, status_aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "guru" ||
    !profile.status_aktif
  ) {
    return {
      authorized: false as const,
      status: 403,
      message: "Kamu tidak memiliki akses untuk fitur ini.",
    };
  }

  return {
    authorized: true as const,
    user,
    admin,
  };
}
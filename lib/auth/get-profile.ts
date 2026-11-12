import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Role = "guru" | "siswa";

export async function getProfile(requiredRole?: Role) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  if (!profile.status_aktif) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  if (profile.role !== "guru" && profile.role !== "siswa") {
    redirect("/login");
  }

  if (requiredRole && profile.role !== requiredRole) {
    redirect(
      profile.role === "guru"
        ? "/dashboard/guru"
        : "/dashboard/siswa"
    );
  }

  return {
    user,
    profile,
  };
}
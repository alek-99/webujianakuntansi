import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status_aktif")
      .eq("id", user.id)
      .single();

    if (profile?.status_aktif) {
      redirect(
        profile.role === "guru"
          ? "/dashboard/guru"
          : "/dashboard/siswa"
      );
    }
  }

  return <LoginForm />;
}
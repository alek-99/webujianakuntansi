import { getProfile } from "@/lib/auth/get-profile";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication dan validasi akun
  const { user, profile } = await getProfile();

  return (
    <DashboardShell
      user={{
        email: user.email ?? "",
      }}
      profile={{
        id: profile.id,
        nama: profile.nama,
        role: profile.role,
        nis: profile.nis,
        nip: profile.nip,
      }}
    >
      {children}
    </DashboardShell>
  );
}
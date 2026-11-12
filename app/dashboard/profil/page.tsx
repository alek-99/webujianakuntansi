import { getProfile } from "@/lib/auth/get-profile";
import ProfileSettings from "@/components/dashboard/ProfileSettings";

export default async function ProfilePage() {
  // Memastikan pengguna sudah login dan profilnya valid.
  await getProfile();

  return <ProfileSettings />;
}
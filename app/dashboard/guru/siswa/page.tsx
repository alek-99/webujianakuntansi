import { getProfile } from "@/lib/auth/get-profile";
import StudentManagement from "@/components/dashboard/StudentManagement";

export default async function SiswaPage() {
  await getProfile("guru");

  return <StudentManagement />;
}
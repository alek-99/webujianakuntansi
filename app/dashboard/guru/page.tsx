import { getProfile } from "@/lib/auth/get-profile";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  UserCircle,
} from "lucide-react";

export default async function GuruDashboard() {
  const { user, profile } = await getProfile("guru");

  const supabase = await createClient();

  // Mengambil jumlah siswa
  const { count: totalSiswa } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "siswa")
    .eq("status_aktif", true);

  const stats = [
    {
      title: "Total Siswa",
      value: totalSiswa ?? 0,
      icon: Users,
      color: "bg-blue-300",
    },
    {
      title: "Mata Pelajaran",
      value: "0",
      icon: BookOpen,
      color: "bg-yellow-300",
    },
    {
      title: "Tugas",
      value: "0",
      icon: ClipboardList,
      color: "bg-green-300",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f4f0]">

      {/* Navbar */}
      <nav className="bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-300 border-2 border-black p-2 rounded-lg">
            <GraduationCap size={25} />
          </div>

          <h1 className="font-black text-xl">
            SCHOOL PORTAL
          </h1>
        </div>

        <LogoutButton />
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10">

        {/* Welcome */}
        <section className="bg-blue-400 border-2 border-black rounded-2xl p-7 shadow-[7px_7px_0px_#000]">
          <div className="flex flex-col md:flex-row justify-between gap-5">
            <div>
              <span className="bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-black">
                DASHBOARD GURU
              </span>

              <h2 className="text-3xl md:text-4xl font-black mt-5">
                Halo, {profile.nama}! 👋
              </h2>

              <p className="mt-2 font-medium">
                Selamat datang di dashboard guru.
              </p>

              <p className="text-sm mt-3 opacity-70">
                {user.email}
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <GraduationCap size={100} />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className={`${stat.color} border-2 border-black rounded-xl p-6 shadow-[5px_5px_0px_#000] hover:-translate-y-1 transition-transform`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">
                      {stat.title}
                    </p>

                    <h3 className="text-4xl font-black mt-3">
                      {stat.value}
                    </h3>
                  </div>

                  <Icon size={38} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Menu */}
        <section className="mt-10">
          <h2 className="text-2xl font-black mb-5">
            Menu Guru
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <MenuCard
              icon={<Users size={30} />}
              title="Data Siswa"
              description="Lihat dan kelola data siswa."
              color="bg-blue-300"
            />

            <MenuCard
              icon={<BookOpen size={30} />}
              title="Mata Pelajaran"
              description="Kelola mata pelajaran."
              color="bg-yellow-300"
            />

            <MenuCard
              icon={<ClipboardList size={30} />}
              title="Penilaian"
              description="Kelola nilai akademik siswa."
              color="bg-green-300"
            />

            <MenuCard
              icon={<CalendarDays size={30} />}
              title="Jadwal"
              description="Lihat jadwal kegiatan belajar."
              color="bg-pink-300"
            />

            <MenuCard
              icon={<UserCircle size={30} />}
              title="Profil Saya"
              description="Lihat informasi akun."
              color="bg-purple-300"
            />
          </div>
        </section>

      </div>
    </main>
  );
}

function MenuCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`${color} border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer`}>
      {icon}

      <h3 className="font-black text-lg mt-4">
        {title}
      </h3>

      <p className="text-sm mt-2 opacity-75">
        {description}
      </p>
    </div>
  );
}
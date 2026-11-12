import { getProfile } from "@/lib/auth/get-profile";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarDays,
  UserCircle,
  Bell,
} from "lucide-react";

export default async function SiswaDashboard() {
  const { user, profile } = await getProfile("siswa");

  const menus = [
    {
      title: "Mata Pelajaran",
      description: "Lihat daftar mata pelajaran.",
      icon: BookOpen,
      color: "bg-blue-300",
    },
    {
      title: "Nilai Saya",
      description: "Lihat hasil penilaian akademik.",
      icon: ClipboardList,
      color: "bg-yellow-300",
    },
    {
      title: "Jadwal Pelajaran",
      description: "Lihat jadwal kegiatan belajar.",
      icon: CalendarDays,
      color: "bg-green-300",
    },
    {
      title: "Profil Saya",
      description: "Lihat informasi akun pribadi.",
      icon: UserCircle,
      color: "bg-purple-300",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f4f0]">

      {/* Navbar */}
      <nav className="bg-white border-b-2 border-black px-6 py-4 flex justify-between items-center">
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
        <section className="bg-yellow-300 border-2 border-black rounded-2xl p-7 shadow-[7px_7px_0px_#000]">
          <span className="bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-black">
            DASHBOARD SISWA
          </span>

          <div className="flex flex-col md:flex-row justify-between items-center mt-5">
            <div>
              <h2 className="text-3xl md:text-4xl font-black">
                Halo, {profile.nama}! 👋
              </h2>

              <p className="mt-3 font-medium">
                Selamat datang kembali di portal siswa.
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                <span className="bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold">
                  NIS: {profile.nis || "-"}
                </span>

                <span className="bg-white border-2 border-black rounded-lg px-3 py-2 text-sm font-bold">
                  Status: Aktif
                </span>
              </div>
            </div>

            <GraduationCap
              size={100}
              className="hidden md:block"
            />
          </div>
        </section>

        {/* Information */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">

          <div className="bg-blue-300 border-2 border-black rounded-xl p-6 shadow-[5px_5px_0px_#000]">
            <BookOpen size={35} />

            <h3 className="font-black text-xl mt-4">
              Pembelajaran
            </h3>

            <p className="text-sm mt-2">
              Akses informasi kegiatan pembelajaran.
            </p>
          </div>

          <div className="bg-green-300 border-2 border-black rounded-xl p-6 shadow-[5px_5px_0px_#000]">
            <ClipboardList size={35} />

            <h3 className="font-black text-xl mt-4">
              Akademik
            </h3>

            <p className="text-sm mt-2">
              Pantau perkembangan akademik kamu.
            </p>
          </div>

        </section>

        {/* Menu */}
        <section className="mt-10">
          <h2 className="text-2xl font-black mb-5">
            Menu Siswa
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {menus.map((menu) => {
              const Icon = menu.icon;

              return (
                <div
                  key={menu.title}
                  className={`${menu.color} border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer`}
                >
                  <Icon size={32} />

                  <h3 className="font-black text-lg mt-4">
                    {menu.title}
                  </h3>

                  <p className="text-sm mt-2 opacity-75">
                    {menu.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Account Information */}
        <section className="mt-10 bg-white border-2 border-black rounded-xl p-6 shadow-[5px_5px_0px_#000]">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={22} />
            <h2 className="font-black text-xl">
              Informasi Akun
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-3 gap-3">
              <span className="text-gray-500">Nama</span>
              <span className="font-bold text-right">
                {profile.nama}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3 gap-3">
              <span className="text-gray-500">Email</span>
              <span className="font-bold text-right break-all">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3 gap-3">
              <span className="text-gray-500">NIS</span>
              <span className="font-bold">
                {profile.nis || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Jenis Kelamin</span>
              <span className="font-bold">
                {profile.jenis_kelamin || "-"}
              </span>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
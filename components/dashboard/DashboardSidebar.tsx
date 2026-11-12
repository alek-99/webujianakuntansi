
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  UserCircle,
  X,
  School,
  Settings,
} from "lucide-react";

interface Profile {
  id?: string;
  nama: string;
  nis: string | null;
  nip: string | null;
  role: "guru" | "siswa";
  avatar_url: string | null;
}

interface SidebarProps {
  role: "guru" | "siswa";
  profile: {
    nama: string;
    nis: string | null;
    nip: string | null;
    avatar_url?: string | null;
  };
  open: boolean;
  onClose: () => void;
}

const guruMenus = [
  {
    label: "Dashboard",
    href: "/dashboard/guru",
    icon: LayoutDashboard,
  },
  {
    label: "Data Siswa",
    href: "/dashboard/guru/siswa",
    icon: Users,
  },
  {
    label: "Bank Soal",
    href: "/dashboard/guru/bank-soal",
    icon: BookOpen,
  },
  {
    label: "Jawaban Siswa",
    href: "/dashboard/guru/hasil-bank-soal",
    icon: ClipboardList,
  },
  {
    label: "Jadwal",
    href: "/dashboard/guru/jadwal",
    icon: CalendarDays,
  },
  {
    label: "Profil Saya",
    href: "/dashboard/profil",
    icon: UserCircle,
  },
];

const siswaMenus = [
  {
    label: "Dashboard",
    href: "/dashboard/siswa",
    icon: LayoutDashboard,
  },
  {
    label: "Soal Ujian",
    href: "/dashboard/siswa/bank-soal",
    icon: BookOpen,
  },
  {
    label: "Nilai Saya",
    href: "/dashboard/siswa/nilai",
    icon: ClipboardList,
  },
  {
    label: "Jadwal Pelajaran",
    href: "/dashboard/siswa/jadwal",
    icon: CalendarDays,
  },
  {
    label: "Profil Saya",
    href: "/dashboard/profil",
    icon: UserCircle,
  },
];

export default function DashboardSidebar({
  role,
  profile: initialProfile,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile>({
    nama: initialProfile.nama,
    nis: initialProfile.nis,
    nip: initialProfile.nip,
    role,
    avatar_url: initialProfile.avatar_url ?? null,
  });

  const [avatarError, setAvatarError] = useState(false);

  // Ambil data profil terbaru dari API /api/profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        // Mendukung respons { profile: ... }, { data: ... }, atau objek profil langsung.
        const data = result.profile ?? result.data ?? result;

        setProfile({
          nama: data.nama ?? initialProfile.nama,
          nis: data.nis ?? initialProfile.nis,
          nip: data.nip ?? initialProfile.nip,
          role: data.role ?? role,
          avatar_url:
            data.avatar_url ?? initialProfile.avatar_url ?? null,
        });

        setAvatarError(false);
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      }
    }

    loadProfile();
  }, [
    role,
    initialProfile.nama,
    initialProfile.nis,
    initialProfile.nip,
    initialProfile.avatar_url,
  ]);

  const menus = role === "guru" ? guruMenus : siswaMenus;
  const roleLabel = role === "guru" ? "Guru" : "Siswa";
  const identity = role === "guru" ? profile.nip : profile.nis;

  const avatarUrl = profile.avatar_url;

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50
          flex flex-col
          w-[260px] h-screen
          bg-white border-r border-slate-200
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[#2563EB] border border-[#E2E8F0] rounded-lg shadow-sm text-white">
              <GraduationCap size={25} />
            </div>

            <div>
              <h1 className="font-semibold text-lg leading-tight">
                AKU
                <span className="text-[#2563EB]">NEX</span>
              </h1>

              <p className="text-[10px] text-[#64748B] font-bold tracking-widest">
                Accounting Examination
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-[#F8FAFC] rounded-lg"
            aria-label="Tutup sidebar"
          >
            <X size={21} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {/* Avatar dari Supabase Storage */}
              <div className="w-11 h-11 shrink-0 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center overflow-hidden">
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={`Foto profil ${profile.nama}`}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <UserCircle
                    size={28}
                    className="text-slate-400"
                  />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate text-slate-800">
                  {profile.nama}
                </h3>

                <p className="text-xs font-bold text-blue-600">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                {role === "guru" ? "NIP" : "NIS"}
              </p>

              <p className="text-xs font-semibold mt-1 text-slate-700">
                {identity || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-5 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold tracking-[2px] text-[#94A3B8] mb-4">
            MENU UTAMA
          </p>

          <nav className="space-y-1">
            {menus.map((menu) => {
              const Icon = menu.icon;

              const active =
                pathname === menu.href ||
                (menu.href !== "/dashboard/guru" &&
                  menu.href !== "/dashboard/siswa" &&
                  pathname.startsWith(`${menu.href}/`));

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3
                    px-3 py-2.5 rounded-lg
                    border border-transparent
                    font-bold text-sm
                    transition-all duration-200
                    ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon size={19} />
                  <span>{menu.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-6 border-t border-[#E2E8F0]" />

          <p className="text-[10px] font-semibold tracking-[2px] text-[#94A3B8] mb-4">
            LAINNYA
          </p>

          <Link
            href={
              role === "guru"
                ? "/dashboard/guru/pengaturan"
                : "/dashboard/siswa/pengaturan"
            }
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-[#F8FAFC] transition-all"
          >
            <Settings size={19} />
            Pengaturan
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-[#64748B]">
            <School size={18} />

            <span className="text-xs font-bold">
              School Management System
            </span>
          </div>

          <p className="text-[10px] text-[#94A3B8] mt-2">
            Version 1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}

"use client";
import NotificationBell from "@/components/guru/NotificationBell";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  user: {
    email: string;
  };
  profile: {
    nama: string;
    role: "guru" | "siswa";
  };
  onMenuClick: () => void;
}

export default function DashboardNavbar({
  user,
  profile,
  onMenuClick,
}: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      alert("Gagal logout. Silakan coba kembali.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 border border-[#E2E8F0] rounded-lg bg-blue-600 text-white shadow-sm active:scale-[0.98]"
        >
          <Menu size={21} />
        </button>

        <div>
          <h2 className="font-semibold text-lg sm:text-xl">
            {profile.role === "guru" ? "Dashboard Guru" : "Dashboard Siswa"}
          </h2>

          <p className="text-xs text-[#64748B] hidden sm:block">
            Selamat datang di School Portal
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {profile.role === "guru" && <NotificationBell />}

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 border border-[#E2E8F0] rounded-lg p-2 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center">
              <UserCircle size={20} />
            </div>

            <div className="hidden sm:block text-left max-w-[130px]">
              <p className="font-semibold text-xs truncate">
                {profile.nama}
              </p>

              <p className="text-[10px] text-[#64748B] capitalize">
                {profile.role}
              </p>
            </div>

            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />

              <div className="absolute right-0 top-14 z-50 w-64 bg-slate-100 border border-slate-200 rounded-lg shadow-lg p-3">
                <div className="p-3 border-b border-[#E2E8F0]">
                  <p className="font-semibold text-sm">
                    {profile.nama}
                  </p>

                  <p className="text-xs text-[#64748B] break-all mt-1">
                    {user.email}
                  </p>

                  <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white border border-[#E2E8F0] rounded text-[10px] font-semibold uppercase">
                    {profile.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 mt-2 text-[#B84C43] hover:bg-red-50 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                >
                  <LogOut size={18} />

                  {loading ? "Keluar..." : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
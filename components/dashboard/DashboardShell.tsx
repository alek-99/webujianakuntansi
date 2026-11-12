"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardNavbar from "./DashboardNavbar";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    email: string;
  };
  profile: {
    id: string;
    nama: string;
    role: "guru" | "siswa";
    nis: string | null;
    nip: string | null;
  };
}

export default function DashboardShell({
  children,
  user,
  profile,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <DashboardSidebar
        role={profile.role}
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-[270px] min-h-screen flex flex-col">

        {/* Navbar */}
        <DashboardNavbar
          user={user}
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-slate-200/10 text-center text-xs text-[#64748B]">
          © 2026 School Portal. All rights reserved.
        </footer>

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  Loader2,
  ShieldCheck,
  BookOpen,
  Users,
  Sparkles,
  CheckCircle2,
  NotebookPen,
  Paperclip,
  Star,
} from "lucide-react";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) throw loginError;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, nama, role, status_aktif")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Profil pengguna tidak ditemukan.");
      }

      if (!profile.status_aktif) {
        await supabase.auth.signOut();
        throw new Error("Akun kamu sedang dinonaktifkan.");
      }

      if (profile.role === "guru") {
        router.replace("/dashboard/guru");
      } else if (profile.role === "siswa") {
        router.replace("/dashboard/siswa");
      } else {
        await supabase.auth.signOut();
        throw new Error("Role pengguna tidak dikenali.");
      }

      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F0E7] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">

      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#9A927F 0.8px, transparent 0.8px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="absolute top-10 left-10 w-24 h-24 bg-[#F6D66B] rotate-12 opacity-30 blur-2xl rounded-full" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#A7B8A0] opacity-30 blur-3xl rounded-full" />

      {/* Main Notebook */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 bg-[#FFFEF9] border-2 border-[#25251F] shadow-[10px_10px_0px_#25251F] overflow-hidden">

        {/* LEFT PANEL */}
        <section className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[#F8F4E9] border-r-2 border-[#25251F] overflow-hidden">

          {/* Notebook Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 35px, #C8D3D0 36px)",
              backgroundPosition: "0 20px",
            }}
          />

          {/* Red Margin Line */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-[#E7A39A] opacity-70" />

          {/* Decorative Tape */}
          <div className="absolute top-0 right-16 w-24 h-8 bg-[#F3D77D]/80 -rotate-3 shadow-sm" />

          <div className="relative z-10">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-[#F6D66B] border-2 border-[#25251F] shadow-[4px_4px_0px_#25251F] flex items-center justify-center -rotate-3">
                <GraduationCap size={29} strokeWidth={2.5} />
              </div>

              <div>
                <h2 className="font-black text-xl tracking-tight text-[#25251F]">
                  SCHOOL<span className="text-[#527A67]">PORTAL</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#858172]">
                  Academic Management
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="mt-24">

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DCE9DC] border border-[#25251F] text-[#365B43] text-xs font-black uppercase tracking-wider -rotate-2">
                <Sparkles size={14} />
                Your Digital Notebook
              </div>

              <h1 className="mt-8 text-5xl xl:text-6xl font-black leading-[1.12] tracking-tight text-[#25251F] font-serif">
                Belajar
                <br />
                Lebih Mudah,
                <br />
                <span className="text-[#527A67] italic">
                  Berkembang
                </span>
                <br />
                Setiap Hari.
              </h1>

              <p className="mt-7 text-[#777365] text-sm leading-8 max-w-md">
                Satu ruang digital untuk mengelola aktivitas akademik,
                memantau kehadiran, dan menghubungkan seluruh lingkungan
                sekolah dengan lebih mudah.
              </p>

              {/* Feature Notes */}
              <div className="grid grid-cols-2 gap-4 mt-12">

                <div className="relative p-5 bg-[#FFF1B8] border border-[#25251F] shadow-[4px_4px_0px_#25251F] rotate-[-2deg]">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#E7C85E]/70 rotate-2" />

                  <BookOpen size={25} className="text-[#527A67] mb-4" />

                  <h3 className="font-black text-sm text-[#25251F]">
                    Manajemen Akademik
                  </h3>

                  <p className="text-[#777365] text-xs mt-2 leading-5">
                    Informasi pembelajaran dalam satu sistem.
                  </p>
                </div>

                <div className="relative p-5 bg-[#DCE9DC] border border-[#25251F] shadow-[4px_4px_0px_#25251F] rotate-[2deg]">
                  <div className="absolute -top-2 right-6 w-12 h-4 bg-white/60 -rotate-3" />

                  <Users size={25} className="text-[#527A67] mb-4" />

                  <h3 className="font-black text-sm text-[#25251F]">
                    Data Terintegrasi
                  </h3>

                  <p className="text-[#777365] text-xs mt-2 leading-5">
                    Akses informasi guru dan siswa dengan mudah.
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-[#969080] mt-12 border-t border-dashed border-[#BDB6A5] pt-5">
            <span>© 2026 SCHOOL PORTAL</span>

            <span className="flex items-center gap-2">
              <ShieldCheck size={15} />
              SECURE PLATFORM
            </span>
          </div>

        </section>

        {/* RIGHT PANEL */}
        <section className="relative flex flex-col justify-center p-7 sm:p-12 lg:p-14 xl:p-16">

          {/* Notebook Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 35px, #D5DED7 36px)",
              backgroundPosition: "0 20px",
            }}
          />

          <div className="relative z-10 max-w-md w-full mx-auto">

            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-[#F6D66B] border-2 border-[#25251F] shadow-[3px_3px_0px_#25251F] flex items-center justify-center -rotate-3">
                <GraduationCap size={26} />
              </div>

              <div>
                <h2 className="font-black text-xl text-[#25251F]">
                  SCHOOL<span className="text-[#527A67]">PORTAL</span>
                </h2>

                <p className="text-xs text-[#858172]">
                  Academic Management
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-10">

              <div className="inline-flex items-center gap-2 text-[#527A67] font-black text-xs uppercase tracking-[0.18em] mb-5">
                <NotebookPen size={16} />
                My School Notes
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#25251F] font-serif">
                Selamat
                <br />
                Datang!
              </h2>

              <p className="text-[#858172] mt-4 leading-7 text-sm">
                Masuk ke akun kamu dan lanjutkan aktivitas
                belajar di School Portal.
              </p>

              <div className="flex items-center gap-2 mt-5 text-xs font-bold text-[#A69E8B]">
                <Star size={13} className="text-[#D4A92E]" />
                <span>YOUR LEARNING SPACE STARTS HERE</span>
              </div>
            </div>

            {/* Error */}
            {(error || searchParams.get("error") === "inactive") && (
              <div className="mb-6 p-4 border-2 border-[#C85B50] bg-[#FCE8E5] text-[#A33C32] text-sm flex gap-3 items-start">
                <span className="font-black mt-0.5">!</span>

                <p>
                  {error || "Akun kamu sedang dinonaktifkan."}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-black text-[#25251F] mb-3">
                  Alamat Email
                </label>

                <div className="relative group">

                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99917E] group-focus-within:text-[#527A67] transition-colors"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    className="w-full h-14 pl-12 pr-4 border-2 border-[#D8D2C4] bg-[#FFFEF9] text-sm font-medium text-[#25251F] outline-none transition-all focus:border-[#527A67] focus:shadow-[4px_4px_0px_#527A67] placeholder:text-[#B7B0A2]"
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-black text-[#25251F] mb-3">
                  Password
                </label>

                <div className="relative group">

                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99917E] group-focus-within:text-[#527A67] transition-colors"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                    className="w-full h-14 pl-12 pr-12 border-2 border-[#D8D2C4] bg-[#FFFEF9] text-sm font-medium text-[#25251F] outline-none transition-all focus:border-[#527A67] focus:shadow-[4px_4px_0px_#527A67] placeholder:text-[#B7B0A2]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#99917E] hover:text-[#527A67] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-14 border-2 border-[#25251F] bg-[#527A67] text-white font-black text-sm flex items-center justify-center gap-3 shadow-[5px_5px_0px_#25251F] transition-all duration-200 hover:bg-[#3F6652] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#25251F] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sedang Memproses...
                  </>
                ) : (
                  <>
                    Login Sekarang
                    <ArrowRight
                      size={19}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

            </form>

            {/* Security Note */}
            <div className="relative mt-10 p-4 bg-[#FFF1B8] border border-[#D9C477] rotate-[-1deg]">

              <div className="absolute -top-3 left-8 w-16 h-5 bg-[#E7C85E]/70 rotate-2" />

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 border border-[#C5A84D] bg-[#F8DE91] flex items-center justify-center shrink-0">
                  <ShieldCheck size={21} className="text-[#527A67]" />
                </div>

                <div>
                  <p className="text-xs font-black text-[#25251F]">
                    Koneksi Aman dan Terlindungi
                  </p>

                  <p className="text-[11px] text-[#858172] mt-1">
                    Autentikasi menggunakan Supabase Security.
                  </p>
                </div>

                <CheckCircle2
                  size={18}
                  className="text-[#527A67] ml-auto shrink-0"
                />

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-[#A69E8B] mt-10">
              <Paperclip size={13} />
              © 2026 School Portal. All rights reserved.
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

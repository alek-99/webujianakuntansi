
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  UserRound,
  Camera,
  Trash2,
  Save,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface Profile {
  id: string;
  nama: string;
  email: string;
  nis: string | null;
  nip: string | null;
  role: "guru" | "siswa";
  jenis_kelamin: "L" | "P" | null;
  no_hp: string | null;
  alamat: string | null;
  avatar_url: string | null;
  status_aktif: boolean;
}

interface ProfileForm {
  nama: string;
  nip: string;
  jenis_kelamin: "" | "L" | "P";
  no_hp: string;
  alamat: string;
}

export default function ProfileSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  // Form profil
  const [form, setForm] = useState<ProfileForm>({
    nama: "",
    nip: "",
    jenis_kelamin: "",
    no_hp: "",
    alamat: "",
  });

  // Notifikasi
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil profil."
        );
      }

      const data: Profile = result.profile;

      setProfile(data);

      // Isi form dari database
      setForm({
        nama: data.nama || "",
        nip: data.nip || "",
        jenis_kelamin: data.jenis_kelamin || "",
        no_hp: data.no_hp || "",
        alamat: data.alamat || "",
      });

      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: form.nama.trim(),

          // NIP hanya dikirim untuk akun guru
          ...(profile.role === "guru" && {
            nip: form.nip.trim(),
          }),

          jenis_kelamin: form.jenis_kelamin || null,
          no_hp: form.no_hp.trim(),
          alamat: form.alamat.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal memperbarui profil."
        );
      }

      // Perbarui data profil dari respons API
      setProfile((previous) =>
        previous
          ? {
              ...previous,
              ...result.profile,
            }
          : result.profile
      );

      // Sinkronisasi form dengan database
      setForm({
        nama: result.profile.nama || "",
        nip: result.profile.nip || "",
        jenis_kelamin: result.profile.jenis_kelamin || "",
        no_hp: result.profile.no_hp || "",
        alamat: result.profile.alamat || "",
      });

      setMessage({
        type: "success",
        text: result.message || "Profil berhasil diperbarui.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // UPLOAD AVATAR
  // ==========================================

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setMessage({
        type: "error",
        text: "Gunakan format JPG, PNG, atau WEBP.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Ukuran gambar maksimal 2 MB.",
      });

      event.target.value = "";
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();

      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengunggah avatar."
        );
      }

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              avatar_url: result.avatar_url,
            }
          : previous
      );

      setMessage({
        type: "success",
        text: "Avatar berhasil diperbarui.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Upload gagal.",
      });
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // ==========================================
  // DELETE AVATAR
  // ==========================================

  async function handleDeleteAvatar() {
    if (!profile?.avatar_url) return;

    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus avatar?"
    );

    if (!confirmed) return;

    setDeletingAvatar(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus avatar."
        );
      }

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              avatar_url: null,
            }
          : previous
      );

      setMessage({
        type: "success",
        text: "Avatar berhasil dihapus.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan.",
      });
    } finally {
      setDeletingAvatar(false);
    }
  }

  // ==========================================
  // AVATAR INITIALS
  // ==========================================

  const initials =
    profile?.nama
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U";

  // ==========================================
  // STYLING
  // ==========================================

  const inputClass = `
    w-full rounded-xl border border-gray-200
    bg-white px-4 py-3 text-sm text-gray-800
    placeholder:text-gray-400
    outline-none transition-all duration-200
    hover:border-gray-300
    focus:border-indigo-400
    focus:ring-4 focus:ring-indigo-500/10
    disabled:cursor-not-allowed disabled:bg-gray-50
  `;

  const labelClass = `
    mb-2 block text-sm font-medium text-gray-700
  `;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>

          <p className="text-sm font-medium text-gray-500">
            Memuat informasi profil...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROFILE NOT FOUND
  // ==========================================

  if (!profile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <UserRound className="h-7 w-7 text-gray-500" />
        </div>

        <h3 className="mt-4 font-semibold text-gray-900">
          Profil tidak dapat dimuat
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Silakan coba beberapa saat lagi.
        </p>

        <button
          type="button"
          onClick={loadProfile}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Coba lagi
          <ArrowRight size={16} />
        </button>

        {message && (
          <p className="mt-4 text-sm text-red-600">
            {message.text}
          </p>
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="space-y-8 text-gray-900">

      {/* HEADER */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-600">
          <UserRound size={17} />
          <span>Account Settings</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
          Pengaturan Profil
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Kelola informasi pribadi dan foto profil akun kamu.
        </p>
      </div>

      {/* NOTIFICATION */}
      {message && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition-all duration-300 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* AVATAR SECTION */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center md:p-8">

          {/* AVATAR */}
          <div className="relative mx-auto sm:mx-0">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 text-3xl font-semibold text-gray-600 shadow-md ring-1 ring-gray-200 md:h-32 md:w-32 md:text-4xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`Avatar ${profile.nama}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Ganti avatar"
              className="absolute bottom-1 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Camera size={17} />
              )}
            </button>
          </div>

          {/* AVATAR INFO */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                Profile Picture
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {profile.status_aktif ? "Active" : "Inactive"}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">
              {profile.nama}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {profile.role === "guru" ? "Guru" : "Siswa"} Account
            </p>

            <p className="mt-3 text-xs text-gray-400">
              JPG, PNG, atau WEBP. Maksimal 2 MB.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? "Mengunggah..." : "Upload Foto"}
              </button>

              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingAvatar ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {deletingAvatar ? "Menghapus..." : "Hapus Foto"}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* SECURITY INFO */}
          <div className="hidden items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Personal Account
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Informasi akun kamu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROFILE FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          {/* SECTION HEADER */}
          <div className="mb-7 flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserRound size={21} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Informasi Pribadi
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Perbarui informasi pribadi akun kamu.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* NAMA */}
            <div className="md:col-span-2">
              <label className={labelClass}>
                Nama Lengkap
              </label>

              <input
                name="nama"
                value={form.nama}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                className={inputClass}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className={labelClass}>
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={profile.email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50 pl-11 text-gray-500`}
                />
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Email dikelola melalui pengaturan akun.
              </p>
            </div>

            {/* NIP GURU / NIS SISWA */}
            <div>
              <label className={labelClass}>
                {profile.role === "guru"
                  ? "Nomor Induk Pegawai (NIP)"
                  : "Nomor Induk Siswa (NIS)"}
              </label>

              <div className="relative">
                <GraduationCap
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                {profile.role === "guru" ? (
                  // NIP GURU BISA DIEDIT
                  <input
                    type="text"
                    name="nip"
                    value={form.nip}
                    onChange={handleChange}
                    maxLength={30}
                    autoComplete="off"
                    className={`${inputClass} pl-11`}
                    placeholder="Masukkan NIP"
                  />
                ) : (
                  // NIS SISWA TETAP READ ONLY
                  <input
                    type="text"
                    value={profile.nis || "-"}
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-gray-50 pl-11 text-gray-500`}
                  />
                )}
              </div>

              {profile.role === "guru" && (
                <p className="mt-2 text-xs text-gray-400">
                  NIP dapat diperbarui melalui halaman profil.
                </p>
              )}
            </div>

            {/* JENIS KELAMIN */}
            <div>
              <label className={labelClass}>
                Jenis Kelamin
              </label>

              <select
                name="jenis_kelamin"
                value={form.jenis_kelamin}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* NO HP */}
            <div>
              <label className={labelClass}>
                Nomor HP
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  name="no_hp"
                  value={form.no_hp}
                  onChange={handleChange}
                  maxLength={20}
                  className={`${inputClass} pl-11`}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            {/* ALAMAT */}
            <div className="md:col-span-2">
              <label className={labelClass}>
                Alamat
              </label>

              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />

                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  maxLength={500}
                  rows={4}
                  className={`${inputClass} resize-none pl-11`}
                  placeholder="Masukkan alamat lengkap..."
                />
              </div>

              <p className="mt-2 text-right text-xs text-gray-400">
                {form.alamat.length}/500 karakter
              </p>
            </div>
          </div>
        </section>

        {/* ACCOUNT STATUS */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Status Akun
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Informasi status akun kamu saat ini.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                  profile.status_aktif
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    profile.status_aktif
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />

                {profile.status_aktif
                  ? "Akun Aktif"
                  : "Akun Tidak Aktif"}
              </span>

              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium capitalize text-gray-600">
                {profile.role}
              </span>
            </div>
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
          <button
            type="submit"
            disabled={saving || uploading || deletingAvatar}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-indigo-600 px-6 py-3
              text-sm font-medium text-white
              shadow-sm transition-all duration-200
              hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md
              active:translate-y-0
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

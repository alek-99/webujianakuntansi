"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  X,
  Loader2,
  GraduationCap,
  Mail,
  Lock,
  Phone,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface Student {
  id: string;
  nama: string;
  nis: string | null;
  email: string;
  jenis_kelamin: "L" | "P" | null;
  no_hp: string | null;
  alamat: string | null;
  status_aktif: boolean;
  created_at: string;
}

type StudentForm = {
  nama: string;
  email: string;
  password: string;
  nis: string;
  jenis_kelamin: "L" | "P";
  no_hp: string;
  alamat: string;
  status_aktif: boolean;
};

const initialForm: StudentForm = {
  nama: "",
  email: "",
  password: "",
  nis: "",
  jenis_kelamin: "L",
  no_hp: "",
  alamat: "",
  status_aktif: true,
};

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ambil data siswa
  const fetchStudents = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/guru/siswa", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setStudents(result.students ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data siswa."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Statistik
  const totalSiswa = students.length;

  const siswaAktif = students.filter(
    (student) => student.status_aktif
  ).length;

  const siswaNonaktif = totalSiswa - siswaAktif;

  // Pencarian
  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase();

    return (
      student.nama.toLowerCase().includes(keyword) ||
      (student.nis ?? "").toLowerCase().includes(keyword) ||
      student.email.toLowerCase().includes(keyword)
    );
  });

  // Update form
  function updateForm<K extends keyof StudentForm>(
    key: K,
    value: StudentForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Buka modal tambah
  function openCreateModal() {
    setEditing(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  // Buka modal edit
  function openEditModal(student: Student) {
    setEditing(student);

    setForm({
      nama: student.nama,
      email: student.email,
      password: "",
      nis: student.nis ?? "",
      jenis_kelamin: student.jenis_kelamin ?? "L",
      no_hp: student.no_hp ?? "",
      alamat: student.alamat ?? "",
      status_aktif: student.status_aktif,
    });

    setError("");
    setModalOpen(true);
  }

  // Simpan data
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(editing);

      const url = isEditing
        ? `/api/guru/siswa/${editing!.id}`
        : "/api/guru/siswa";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setSuccess(result.message);
      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);

      await fetchStudents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  }

  // Hapus siswa
  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus akun ${student.nama}?\n\nData profil siswa akan ikut terhapus secara permanen.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/guru/siswa/${student.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setSuccess(result.message);

      await fetchStudents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus siswa."
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#2563EB] mb-2">
            <GraduationCap size={18} />
            MANAJEMEN AKADEMIK
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Data Siswa
          </h1>

          <p className="text-[#64748B] mt-2 text-sm">
            Kelola akun dan informasi seluruh siswa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-[#2563EB] border border-[#E2E8F0] px-5 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={20} />
          Tambah Siswa
        </button>
      </section>

      {/* Notification */}
      {success && (
        <div className="flex justify-between items-center gap-3 p-4 bg-[#E7F0E5] border border-[#2563EB] rounded-lg text-[#1D4ED8] font-bold text-sm">
          {success}

          <button onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex justify-between items-center gap-3 p-4 bg-[#FCE8E5] border border-[#FECACA] rounded-lg text-[#B91C1C] font-bold text-sm">
          {error}

          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <StatCard
          title="Total Siswa"
          value={totalSiswa}
          icon={<Users size={28} />}
          color="bg-[#F1F5F9]"
        />

        <StatCard
          title="Siswa Aktif"
          value={siswaAktif}
          icon={<UserCheck size={28} />}
          color="bg-[#EFF6FF]"
        />

        <StatCard
          title="Siswa Nonaktif"
          value={siswaNonaktif}
          icon={<UserX size={28} />}
          color="bg-[#FEF2F2]"
        />

      </section>

      {/* Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-xl">
              Daftar Siswa
            </h2>

            <p className="text-xs text-[#64748B] mt-1">
              {filteredStudents.length} data ditemukan
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIS, email..."
                className="w-full h-11 pl-10 pr-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
              />
            </div>

            <button
              onClick={fetchStudents}
              disabled={loading}
              title="Refresh"
              className="w-11 h-11 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#EFF6FF]"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">Siswa</th>
                <th className="p-4 font-semibold">NIS</th>
                <th className="p-4 font-semibold">Jenis Kelamin</th>
                <th className="p-4 font-semibold">No. HP</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="animate-spin mx-auto mb-3" />
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Users size={40} className="mx-auto text-[#94A3B8] mb-3" />

                    <p className="font-bold">
                      Data siswa tidak ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-semibold">
                          {student.nama.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {student.nama}
                          </p>

                          <p className="text-xs text-[#64748B]">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold">
                      {student.nis || "-"}
                    </td>

                    <td className="p-4">
                      {student.jenis_kelamin === "L"
                        ? "Laki-laki"
                        : student.jenis_kelamin === "P"
                        ? "Perempuan"
                        : "-"}
                    </td>

                    <td className="p-4">
                      {student.no_hp || "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                          student.status_aktif
                            ? "bg-emerald-50 border-[#2563EB] text-[#1D4ED8]"
                            : "bg-red-50 border-[#FECACA] text-red-700"
                        }`}
                      >
                        {student.status_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit siswa"
                          className="w-9 h-9 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(student)}
                          title="Hapus siswa"
                          className="w-9 h-9 flex items-center justify-center text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#EFF6FF] border-b border-slate-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editing ? "Edit Akun Siswa" : "Tambah Akun Siswa"}
                </h2>

                <p className="text-xs font-medium mt-1">
                  Lengkapi informasi akun siswa.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg bg-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {error && (
                <div className="p-3 bg-[#FCE8E5] border border-[#FECACA] rounded-lg text-[#B91C1C] text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">

                <FormField label="Nama Lengkap" icon={<Users size={17} />}>
                  <input
                    required
                    value={form.nama}
                    onChange={(e) => updateForm("nama", e.target.value)}
                    placeholder="Nama siswa"
                    className="form-input"
                  />
                </FormField>

                <FormField label="NIS">
                  <input
                    required
                    value={form.nis}
                    onChange={(e) => updateForm("nis", e.target.value)}
                    placeholder="Nomor induk siswa"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Email" icon={<Mail size={17} />}>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="siswa@email.com"
                    className="form-input"
                  />
                </FormField>

                <FormField label={editing ? "Password Baru (Opsional)" : "Password"} icon={<Lock size={17} />}>
                  <input
                    required={!editing}
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Jenis Kelamin">
                  <select
                    value={form.jenis_kelamin}
                    onChange={(e) =>
                      updateForm("jenis_kelamin", e.target.value as "L" | "P")
                    }
                    className="form-input"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </FormField>

                <FormField label="Nomor HP" icon={<Phone size={17} />}>
                  <input
                    value={form.no_hp}
                    onChange={(e) => updateForm("no_hp", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="form-input"
                  />
                </FormField>

              </div>

              <FormField label="Alamat" icon={<MapPin size={17} />}>
                <textarea
                  rows={3}
                  value={form.alamat}
                  onChange={(e) => updateForm("alamat", e.target.value)}
                  placeholder="Alamat lengkap siswa"
                  className="form-input resize-none"
                />
              </FormField>

              {editing && (
                <label className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">
                      Status Akun
                    </p>

                    <p className="text-xs text-[#64748B] mt-1">
                      Izinkan siswa login ke sistem.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.status_aktif}
                    onChange={(e) =>
                      updateForm("status_aktif", e.target.checked)
                    }
                    className="w-5 h-5 accent-green-600"
                  />
                </label>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 border border-[#E2E8F0] rounded-lg font-bold hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] border border-[#E2E8F0] rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      {editing ? "Simpan Perubahan" : "Buat Akun Siswa"}
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .form-input {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px;
          border: 2px solid #D8D2C4;
          border-radius: 0;
          outline: none;
          font-size: 14px;
          background: #FFFEF9;
        }

        .form-input:focus {
          background: #FFF9E6;
          border-color: #527A67; box-shadow: 3px 3px 0px #527A67;
        }
      `}</style>
    </div>
  );
}

// Statistik
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`${color} border border-slate-200 rounded-xl p-5 shadow-sm`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-sm">
            {title}
          </p>

          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-3">
            {value}
          </h3>
        </div>

        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Form Field
function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold mb-2">
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}
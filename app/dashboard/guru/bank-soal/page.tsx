
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Filter,
  Loader2,
  Package,
} from "lucide-react";
import type { BankSoal } from "@/types/bank-soal";

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  aktif: "bg-emerald-50 text-emerald-700",
  arsip: "bg-amber-50 text-amber-700",
};

const difficultyStyle: Record<string, string> = {
  mudah: "bg-green-50 text-green-700",
  sedang: "bg-blue-50 text-blue-700",
  sulit: "bg-red-50 text-red-700",
};

export default function BankSoalPage() {
  const [data, setData] = useState<BankSoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("semua");
  const [difficulty, setDifficulty] = useState("semua");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/guru/bank-soal", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat bank soal.");
      }

      setData(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return data.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.judul.toLowerCase().includes(keyword) ||
        item.materi.toLowerCase().includes(keyword) ||
        item.nama_barang.toLowerCase().includes(keyword) ||
        (item.kode_barang ?? "").toLowerCase().includes(keyword);

      const matchesStatus =
        status === "semua" || item.status === status;

      const matchesDifficulty =
        difficulty === "semua" ||
        item.tingkat_kesulitan === difficulty;

      return matchesSearch && matchesStatus && matchesDifficulty;
    });
  }, [data, search, status, difficulty]);

  async function handleDelete(item: BankSoal) {
    const confirmed = window.confirm(
      `Hapus bank soal "${item.judul}"?\n\nTransaksi dan kunci jawaban yang terkait juga akan dihapus.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/guru/bank-soal/${item.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus bank soal.");
      }

      setData((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Gagal menghapus bank soal."
      );
    }
  }

  const totalAktif = data.filter((item) => item.status === "aktif").length;
  const totalDraft = data.filter((item) => item.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-blue-700">
            <BookOpen size={17} />
            <span>Manajemen Pembelajaran</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bank Soal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola kumpulan soal dan kunci jawaban untuk ujian siswa.
          </p>
        </div>

        <Link
          href="/dashboard/guru/bank-soal/tambah"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Tambah Bank Soal
        </Link>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Bank Soal</p>
            <BookOpen className="text-blue-700" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? "—" : data.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Soal Aktif</p>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-700">
            {loading ? "—" : totalAktif}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Soal Draft</p>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-700">
            {loading ? "—" : totalDraft}
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, materi, atau barang..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="draft">Draft</option>
            <option value="arsip">Arsip</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="semua">Semua Kesulitan</option>
            <option value="mudah">Mudah</option>
            <option value="sedang">Sedang</option>
            <option value="sulit">Sulit</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("semua");
              setDifficulty("semua");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Filter size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* DATA */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Daftar Bank Soal
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Menampilkan {filteredData.length} dari {data.length} soal
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Muat ulang"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
          </button>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="animate-spin text-blue-700" size={28} />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="mb-3 rounded-full bg-blue-50 p-4">
              <Package size={28} className="text-blue-700" />
            </div>
            <h3 className="font-semibold text-slate-800">
              {data.length === 0
                ? "Belum ada bank soal"
                : "Bank soal tidak ditemukan"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {data.length === 0
                ? "Mulai buat bank soal pertama untuk materi Akuntansi Keuangan."
                : "Coba ubah kata kunci atau filter pencarian."}
            </p>
            {data.length === 0 && (
              <Link
                href="/dashboard/guru/bank-soal/tambah"
                className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Buat Bank Soal
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* TABEL DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Bank Soal</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Kesulitan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {item.judul}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.materi} · {item.nama_barang}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">
                          {item.metode_persediaan}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.metode_penilaian === "fifo"
                            ? "FIFO"
                            : "Rata-rata Bergerak"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle[item.tingkat_kesulitan]}`}>
                          {item.tingkat_kesulitan}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/dashboard/guru/bank-soal/${item.id}`}
                            title="Detail"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={17} />
                          </Link>
                          <Link
                            href={`/dashboard/guru/bank-soal/${item.id}/edit`}
                            title="Edit"
                            className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Pencil size={17} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus"
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KARTU MOBILE */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredData.map((item) => (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {item.judul}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.materi} · {item.nama_barang}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                      {item.metode_persediaan}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                      {item.metode_penilaian === "fifo" ? "FIFO" : "Rata-rata Bergerak"}
                    </span>
                    <span className={`rounded-md px-2 py-1 ${difficultyStyle[item.tingkat_kesulitan]}`}>
                      {item.tingkat_kesulitan}
                    </span>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href={`/dashboard/guru/bank-soal/${item.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm text-slate-600"
                    >
                      <Eye size={15} /> Detail
                    </Link>
                    <Link
                      href={`/dashboard/guru/bank-soal/${item.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm text-slate-600"
                    >
                      <Pencil size={15} /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

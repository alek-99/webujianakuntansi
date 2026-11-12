
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Search,
  ClipboardCheck,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface BankSoal {
  id: string;
  judul: string;
  deskripsi: string | null;
  mata_pelajaran: string;
  materi: string;
  nama_barang: string;
  metode_persediaan: string;
  metode_penilaian: string;
  tingkat_kesulitan: string;
  sudah_dikerjakan: boolean;
}

export default function BankSoalSiswaPage() {
  const [data, setData] = useState<BankSoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const response = await fetch("/api/siswa/bank-soal");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setData(result.data ?? []);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Gagal mengambil bank soal."
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter((item) =>
    `${item.judul} ${item.materi} ${item.nama_barang}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selesai = data.filter((item) => item.sudah_dikerjakan).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          PEMBELAJARAN
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Bank Soal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Unduh soal, kerjakan secara manual, kemudian masukkan
          jawaban kartu persediaan melalui website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total bank soal</p>
              <p className="text-2xl font-bold text-slate-900">
                {data.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sudah dikerjakan</p>
              <p className="text-2xl font-bold text-slate-900">
                {selesai}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul soal atau materi..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-blue-600" size={30} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpen className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 font-semibold text-slate-700">
            Belum ada bank soal
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Soal yang tersedia akan ditampilkan di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <BookOpen size={22} />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.sudah_dikerjakan
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.sudah_dikerjakan
                    ? "Sudah dikerjakan"
                    : "Belum dikerjakan"}
                </span>
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                {item.judul}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {item.deskripsi || item.materi}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-slate-600">
                  {item.mata_pelajaran}
                </span>
                <span className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-700">
                  {item.metode_penilaian.toUpperCase()}
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-slate-600">
                  {item.tingkat_kesulitan}
                </span>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Barang:{" "}
                  <span className="font-semibold text-slate-800">
                    {item.nama_barang}
                  </span>
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/dashboard/siswa/bank-soal/${item.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {item.sudah_dikerjakan ? "Lihat hasil" : "Kerjakan"}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

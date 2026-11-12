
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  ChartNoAxesColumnIncreasing,
  Eye,
  Search,
  Loader2,
  BookOpen,
} from "lucide-react";

interface Pengerjaan {
  id: string;
  nilai: number;
  jumlah_benar: number;
  jumlah_kunci: number;
  submitted_at: string;
  siswa: {
    id: string;
    nama: string;
    nis: string | null;
  };
}

interface BankSoal {
  id: string;
  judul: string;
  mata_pelajaran: string;
  materi: string | null;
  status: string;
  total_pengerjaan: number;
  rata_rata: number;
  pengerjaan: Pengerjaan[];
}

export default function HasilBankSoalList() {
  const [data, setData] = useState<BankSoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/guru/hasil-bank-soal");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        setData(result.data ?? []);
      } catch (error) {
        console.error("Gagal mengambil hasil:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredData = data.filter((item) =>
    `${item.judul} ${item.mata_pelajaran} ${item.materi ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPengerjaan = data.reduce(
    (total, item) => total + item.total_pengerjaan,
    0
  );

  const totalNilai = data.flatMap((item) => item.pengerjaan);
  const rataRata =
    totalNilai.length > 0
      ? (
          totalNilai.reduce((total, item) => total + Number(item.nilai), 0) /
          totalNilai.length
        ).toFixed(1)
      : "0";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={30} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hasil Jawaban Siswa
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau hasil pengerjaan dan nilai siswa dari bank soal Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Bank Soal</p>
            <BookOpen className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Pengerjaan</p>
            <Users className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {totalPengerjaan}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Rata-rata Nilai</p>
            <ChartNoAxesColumnIncreasing className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {rataRata}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul atau mata pelajaran..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <ClipboardList className="mx-auto text-slate-400" size={38} />
          <p className="mt-3 font-semibold text-slate-700">
            {search ? "Data tidak ditemukan" : "Belum ada bank soal"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Hasil pengerjaan siswa akan muncul di halaman ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((soal) => (
            <div
              key={soal.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {soal.judul}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {soal.mata_pelajaran}
                    {soal.materi ? ` • ${soal.materi}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700">
                    {soal.total_pengerjaan} siswa mengerjakan
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                    Rata-rata: {soal.rata_rata}
                  </span>
                </div>
              </div>

              {soal.pengerjaan.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  Belum ada siswa yang mengerjakan soal ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Nama Siswa</th>
                        <th className="px-5 py-3">NIS</th>
                        <th className="px-5 py-3">Jawaban Benar</th>
                        <th className="px-5 py-3">Nilai</th>
                        <th className="px-5 py-3 text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {soal.pengerjaan.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 font-medium text-slate-800">
                            {item.siswa.nama}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {item.siswa.nis ?? "-"}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {item.jumlah_benar}/{item.jumlah_kunci}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg px-3 py-1.5 font-bold ${
                                Number(item.nilai) >= 75
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {Number(item.nilai).toFixed(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/dashboard/guru/hasil-bank-soal/${item.id}`}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              <Eye size={15} />
                              Lihat Jawaban
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

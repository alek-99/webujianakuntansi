
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  UserRound,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";

interface Jawaban {
  transaksi_id: string;
  field_key: string;
  nilai_jawaban: string | number | null;
  benar: boolean;
  nilai_diperoleh: number;
}

interface Kunci {
  transaksi_id: string;
  field_key: string;
  nilai_benar: string | number | null;
  bobot: number;
  toleransi: number | null;
}

interface Transaksi {
  id: string;
  urutan: number;
  tanggal: string;
  keterangan: string;
  jenis_transaksi: string;
  jumlah: number;
  harga_satuan: number;
  jawaban: Jawaban[];
  kunci: Kunci[];
}

interface DetailData {
  pengerjaan: {
    id: string;
    nilai: number;
    jumlah_benar: number;
    jumlah_kunci: number;
    submitted_at: string;
  };
  soal: {
    judul: string;
    mata_pelajaran: string;
    materi: string | null;
    nama_barang: string | null;
    metode_persediaan: string | null;
    metode_penilaian: string | null;
  };
  siswa: {
    nama: string;
    nis: string | null;
  };
  transaksi: Transaksi[];
}

const FIELD_LABELS: Record<string, string> = {
  masuk_qty: "Masuk - Jumlah",
  masuk_harga: "Masuk - Harga Satuan",
  masuk_total: "Masuk - Total",
  keluar_qty: "Keluar - Jumlah",
  keluar_harga: "Keluar - Harga Satuan",
  keluar_total: "Keluar - Total",
  saldo_qty: "Saldo - Jumlah",
  saldo_harga: "Saldo - Harga Satuan",
  saldo_total: "Saldo - Total",
};

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";

  const number = Number(value);

  if (!Number.isFinite(number)) return String(value);

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
}

export default function HasilBankSoalDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await fetch(
          `/api/guru/hasil-bank-soal/${params.id}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data.");
        }

        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan."
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={30} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-700">
          {error || "Data tidak ditemukan."}
        </p>
        <Link
          href="/dashboard/guru/hasil-bank-soal"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={16} />
          Kembali ke hasil pengerjaan
        </Link>
      </div>
    );
  }

  const { pengerjaan, soal, siswa, transaksi } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/guru/hasil-bank-soal"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Kembali ke hasil pengerjaan
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Detail Jawaban Siswa
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Periksa jawaban dan hasil penilaian siswa.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <UserRound size={23} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{siswa.nama}</h2>
              <p className="text-sm text-slate-500">
                NIS: {siswa.nis ?? "-"}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="font-semibold text-slate-800">{soal.judul}</p>
            <p className="mt-1 text-sm text-slate-500">
              {soal.mata_pelajaran}
              {soal.materi ? ` • ${soal.materi}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {soal.nama_barang && (
                <span className="rounded-lg bg-slate-100 px-3 py-2">
                  Barang: {soal.nama_barang}
                </span>
              )}
              {soal.metode_persediaan && (
                <span className="rounded-lg bg-slate-100 px-3 py-2">
                  Persediaan: {soal.metode_persediaan}
                </span>
              )}
              {soal.metode_penilaian && (
                <span className="rounded-lg bg-slate-100 px-3 py-2">
                  Metode: {soal.metode_penilaian}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Nilai Akhir</p>
          <p className="mt-2 text-4xl font-extrabold text-blue-700">
            {Number(pengerjaan.nilai).toFixed(1)}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <ClipboardCheck size={17} />
            Benar: {pengerjaan.jumlah_benar}/{pengerjaan.jumlah_kunci}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={15} />
            Dikumpulkan: {formatDate(pengerjaan.submitted_at)}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Rincian Jawaban
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Jawaban siswa dibandingkan dengan kunci jawaban guru.
          </p>
        </div>

        {transaksi.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800">
                Transaksi {item.urutan}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {item.tanggal} • {item.keterangan}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.jenis_transaksi} • Jumlah:{" "}
                {formatNumber(item.jumlah)} • Harga: Rp{" "}
                {formatNumber(item.harga_satuan)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-white text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Komponen</th>
                    <th className="px-4 py-3">Jawaban Siswa</th>
                    <th className="px-4 py-3">Kunci Jawaban</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(FIELD_LABELS).map(([key, label]) => {
                    const answer = item.jawaban.find(
                      (j) => j.field_key === key
                    );

                    const correctKey = item.kunci.find(
                      (k) => k.field_key === key
                    );

                    if (!answer && !correctKey) return null;

                    return (
                      <tr key={key}>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {label}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(answer?.nilai_jawaban)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(correctKey?.nilai_benar)}
                        </td>
                        <td className="px-4 py-3">
                          {answer?.benar ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={15} />
                              Benar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <XCircle size={15} />
                              Salah
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {formatNumber(answer?.nilai_diperoleh)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {transaksi.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Tidak ada rincian transaksi pada soal ini.
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  BookOpen,
  Package,
  CalendarDays,
  KeyRound,
} from "lucide-react";
import type { BankSoal } from "@/types/bank-soal";

const fieldLabels: Record<string, string> = {
  masuk_qty: "Masuk - Kuantitas",
  masuk_harga: "Masuk - Harga Satuan",
  masuk_total: "Masuk - Jumlah Harga",
  keluar_qty: "Keluar - Kuantitas",
  keluar_harga: "Keluar - Harga Satuan",
  keluar_total: "Keluar - Jumlah Harga",
  saldo_qty: "Saldo - Kuantitas",
  saldo_harga: "Saldo - Harga Satuan",
  saldo_total: "Saldo - Jumlah Harga",
};

const currency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(value);

export default function BankSoalDetail({ id }: { id: string }) {
  const [data, setData] = useState<BankSoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/guru/bank-soal/${id}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil detail.");
        }

        const normalized = {
          ...result.data,
          bank_soal_transaksi: (
            result.data.bank_soal_transaksi ?? []
          ).sort(
            (a: { urutan: number }, b: { urutan: number }) =>
              a.urutan - b.urutan
          ),
        };

        setData(normalized);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-700" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error || "Bank soal tidak ditemukan."}
        <div className="mt-4">
          <Link
            href="/dashboard/guru/bank-soal"
            className="font-semibold underline"
          >
            Kembali ke Bank Soal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/guru/bank-soal"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Detail Bank Soal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Informasi soal, transaksi, dan kunci jawaban.
          </p>
        </div>

        <Link
          href={`/dashboard/guru/bank-soal/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Pencil size={16} /> Edit Bank Soal
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-700">
              <BookOpen size={17} />
              {data.mata_pelajaran}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {data.judul}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {data.deskripsi || "Tidak ada deskripsi."}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {data.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Materi" value={data.materi} />
          <Info label="Nama Barang" value={data.nama_barang} />
          <Info label="Kode Barang" value={data.kode_barang || "-"} />
          <Info
            label="Metode Persediaan"
            value={data.metode_persediaan}
          />
          <Info
            label="Metode Penilaian"
            value={
              data.metode_penilaian === "fifo"
                ? "FIFO"
                : "Rata-rata Bergerak"
            }
          />
          <Info
            label="Tingkat Kesulitan"
            value={data.tingkat_kesulitan}
          />
          <Info
            label="Saldo Awal Kuantitas"
            value={String(data.saldo_awal_qty)}
          />
          <Info
            label="Saldo Awal Harga"
            value={currency(Number(data.saldo_awal_harga))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Transaksi
          </h2>
          <p className="text-sm text-slate-500">
            {data.bank_soal_transaksi?.length ?? 0} transaksi tersimpan.
          </p>
        </div>

        {(data.bank_soal_transaksi ?? []).map((item) => {
          const keys =
            item.bank_soal_kunci_detail ?? item.kunci ?? [];

          return (
            <article
              key={item.id ?? item.urutan}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                    {item.urutan}
                  </span>
                  <h3 className="font-semibold text-slate-800">
                    {item.keterangan}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                  {item.jenis_transaksi.replaceAll("_", " ")}
                </span>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-3">
                <Info
                  label="Tanggal"
                  value={new Date(`${item.tanggal}T00:00:00`).toLocaleDateString("id-ID")}
                  icon={<CalendarDays size={15} />}
                />
                <Info
                  label="Jumlah"
                  value={String(item.jumlah)}
                  icon={<Package size={15} />}
                />
                <Info
                  label="Harga Satuan"
                  value={currency(Number(item.harga_satuan))}
                />
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <KeyRound size={16} className="text-amber-600" />
                  <h4 className="text-sm font-semibold text-slate-800">
                    Kunci Jawaban
                  </h4>
                </div>

                {keys.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Belum ada kunci jawaban.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {keys.map((key) => (
                      <div
                        key={key.id ?? key.field_key}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-xs text-slate-500">
                          {fieldLabels[key.field_key] ?? key.field_key}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {Number(key.nilai_benar).toLocaleString("id-ID")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Bobot: {key.bobot} · Toleransi: {key.toleransi}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

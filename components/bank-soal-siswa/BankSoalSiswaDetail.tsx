"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from "lucide-react";

type FieldKey =
  | "masuk_qty"
  | "masuk_harga"
  | "masuk_total"
  | "keluar_qty"
  | "keluar_harga"
  | "keluar_total"
  | "saldo_qty"
  | "saldo_harga"
  | "saldo_total";

interface Transaksi {
  id: string;
  urutan: number;
  tanggal: string;
  keterangan: string;
  jenis_transaksi: string;
  jumlah: number;
  harga_satuan: number;
}

interface BankSoalDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  mata_pelajaran: string;
  materi: string;
  nama_barang: string;
  kode_barang: string | null;
  metode_persediaan: string;
  metode_penilaian: string;
  saldo_awal_qty: number;
  saldo_awal_harga: number;
  tingkat_kesulitan: string;
  bank_soal_transaksi: Transaksi[];
  sudah_dikerjakan: boolean;
  hasil: {
    nilai: number;
    submitted_at: string;
  } | null;
}

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "masuk_qty", label: "Qty" },
  { key: "masuk_harga", label: "Harga" },
  { key: "masuk_total", label: "Jumlah" },
  { key: "keluar_qty", label: "Qty" },
  { key: "keluar_harga", label: "Harga" },
  { key: "keluar_total", label: "Jumlah" },
  { key: "saldo_qty", label: "Qty" },
  { key: "saldo_harga", label: "Harga" },
  { key: "saldo_total", label: "Jumlah" },
];

const FIELD_GROUPS = [
  { label: "Persediaan Masuk", color: "bg-emerald-50 text-emerald-700" },
  { label: "Persediaan Keluar", color: "bg-rose-50 text-rose-700" },
  { label: "Saldo Persediaan", color: "bg-blue-50 text-blue-700" },
];

export default function BankSoalSiswaDetail({ id }: { id: string }) {
  const router = useRouter();

  const [soal, setSoal] = useState<BankSoalDetail | null>(null);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSoal();
  }, [id]);

  async function loadSoal() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/siswa/bank-soal/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil soal.");
      }

      setSoal(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function getInputKey(transaksiId: string, fieldKey: FieldKey) {
    return `${transaksiId}_${fieldKey}`;
  }

  function updateJawaban(
    transaksiId: string,
    fieldKey: FieldKey,
    value: string,
  ) {
    setJawaban((prev) => ({
      ...prev,
      [getInputKey(transaksiId, fieldKey)]: value,
    }));
  }

  function downloadPDF() {
    if (!soal) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("LEMBAR SOAL KARTU PERSEDIAAN", 148, 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Judul: ${soal.judul}`, 14, 26);
    doc.text(`Mata Pelajaran: ${soal.mata_pelajaran}`, 14, 32);
    doc.text(`Materi: ${soal.materi}`, 14, 38);
    doc.text(`Nama Barang: ${soal.nama_barang}`, 14, 44);
    doc.text(
      `Metode: ${soal.metode_persediaan.toUpperCase()} - ${soal.metode_penilaian.toUpperCase()}`,
      14,
      50,
    );

    doc.text(
      `Saldo Awal: ${soal.saldo_awal_qty} unit x Rp ${Number(
        soal.saldo_awal_harga,
      ).toLocaleString("id-ID")}`,
      14,
      56,
    );

    doc.text(
      "Petunjuk: Hitung kartu persediaan berdasarkan metode yang ditentukan.",
      14,
      63,
    );

    const rows = soal.bank_soal_transaksi.map((item) => [
      item.urutan,
      new Date(item.tanggal).toLocaleDateString("id-ID"),
      item.keterangan,
      item.jenis_transaksi.replaceAll("_", " "),
      item.jumlah,
      `Rp ${Number(item.harga_satuan).toLocaleString("id-ID")}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["No", "Tanggal", "Keterangan", "Jenis", "Qty", "Harga Satuan"]],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [31, 66, 160],
      },
    });

    const nextY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 100;

    autoTable(doc, {
      startY: nextY + 8,
      head: [
        [
          "Tanggal / Transaksi",
          "Masuk Qty",
          "Masuk Harga",
          "Masuk Jumlah",
          "Keluar Qty",
          "Keluar Harga",
          "Keluar Jumlah",
          "Saldo Qty",
          "Saldo Harga",
          "Saldo Jumlah",
        ],
      ],
      body: soal.bank_soal_transaksi.map((item) => [
        `${item.urutan}. ${item.keterangan}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]),
      styles: {
        fontSize: 7,
        minCellHeight: 12,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [31, 66, 160],
      },
      columnStyles: {
        0: { cellWidth: 40 },
      },
    });

    doc.save(`Bank-Soal-${soal.nama_barang.replace(/\s+/g, "-")}.pdf`);
  }

  async function submitJawaban() {
    if (!soal) return;

    const totalKolom = soal.bank_soal_transaksi.length * FIELDS.length;

    const terisi = Object.values(jawaban).filter(
      (value) => value.trim() !== "",
    ).length;

    if (terisi !== totalKolom) {
      alert(
        `Jawaban belum lengkap. Isi semua ${totalKolom} kolom terlebih dahulu.`,
      );
      return;
    }

    const konfirmasi = window.confirm(
      "Apakah Anda yakin ingin mengumpulkan jawaban? Jawaban tidak dapat diubah setelah dikirim.",
    );

    if (!konfirmasi) return;

    try {
      setSubmitting(true);

      const payload = soal.bank_soal_transaksi.flatMap((transaksi) =>
        FIELDS.map((field) => ({
          transaksi_id: transaksi.id,
          field_key: field.key,
          nilai: Number(jawaban[getInputKey(transaksi.id, field.key)]),
        })),
      );

      const response = await fetch(`/api/siswa/bank-soal/${id}/jawaban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jawaban: payload }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengumpulkan jawaban.");
      }

      alert(`Jawaban berhasil dikumpulkan. Nilai Anda: ${result.data.nilai}`);

      await loadSoal();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || !soal) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error || "Bank soal tidak ditemukan."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard/siswa/bank-soal")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Kembali ke Bank Soal
      </button>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-sm font-medium text-blue-600">
              BANK SOAL / KARTU PERSEDIAAN
            </p>
            <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
              {soal.judul}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {soal.deskripsi || soal.materi}
            </p>
          </div>

          <button
            onClick={downloadPDF}
            className="inline-flex h-fit items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Download size={17} />
            Download PDF
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Mata Pelajaran", soal.mata_pelajaran],
            ["Materi", soal.materi],
            ["Nama Barang", soal.nama_barang],
            ["Metode", `${soal.metode_persediaan} - ${soal.metode_penilaian}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Saldo Awal Persediaan
          </p>
          <p className="mt-1 text-sm text-blue-800">
            {Number(soal.saldo_awal_qty).toLocaleString("id-ID")} unit
            {" × "}
            Rp {Number(soal.saldo_awal_harga).toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-sm font-bold text-blue-900">
            Total: Rp{" "}
            {(
              Number(soal.saldo_awal_qty) * Number(soal.saldo_awal_harga)
            ).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Daftar Transaksi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Perhatikan setiap transaksi sebelum mengisi kartu persediaan.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3">Jenis</th>
                <th className="p-3 text-right">Jumlah</th>
                <th className="p-3 text-right">Harga Satuan</th>
              </tr>
            </thead>
            <tbody>
              {soal.bank_soal_transaksi.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3">{item.urutan}</td>
                  <td className="p-3">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </td>
                  <td className="p-3">{item.keterangan}</td>
                  <td className="p-3 capitalize">
                    {item.jenis_transaksi.replaceAll("_", " ")}
                  </td>
                  <td className="p-3 text-right">
                    {Number(item.jumlah).toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right">
                    Rp {Number(item.harga_satuan).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {soal.sudah_dikerjakan ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={28} />
            <div>
              <h2 className="font-bold text-emerald-900">
                Jawaban sudah dikumpulkan
              </h2>
              <p className="text-sm text-emerald-700">
                Anda telah menyelesaikan soal ini.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-emerald-800">
            Nilai:{" "}
            <span className="text-xl font-bold">
              {soal.hasil?.nilai ?? "-"}
            </span>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Form Pengisian Kartu Persediaan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Silakan isi setiap kolom sesuai hasil perhitungan Anda. Gunakan
                titik (.) untuk angka desimal. Jangan gunakan titik sebagai
                pemisah ribuan. Contoh: 10.000 ditulis 10000, sedangkan 1000.21
                tetap ditulis 1000.21.
                misalkan 0,20 maka ditulis 0.20
              </p>
            </div>
            <span className="h-fit rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              {soal.bank_soal_transaksi.length * 9} kolom jawaban
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
            {FIELD_GROUPS.map((group) => (
              <div
                key={group.label}
                className={`rounded-lg p-2 ${group.color}`}
              >
                {group.label}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-5">
            {soal.bank_soal_transaksi.map((transaksi) => (
              <div
                key={transaksi.id}
                className="rounded-xl border border-slate-200 p-3 sm:p-4"
              >
                <div className="mb-4">
                  <p className="font-semibold text-slate-900">
                    Transaksi {transaksi.urutan}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(transaksi.tanggal).toLocaleDateString("id-ID")}
                    {" · "}
                    {transaksi.keterangan}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[0, 1, 2].map((groupIndex) => (
                    <div
                      key={groupIndex}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <p className="mb-3 text-xs font-bold text-slate-700">
                        {FIELD_GROUPS[groupIndex].label}
                      </p>

                      <div className="space-y-3">
                        {FIELDS.slice(groupIndex * 3, groupIndex * 3 + 3).map(
                          (field) => (
                            <div key={field.key}>
                              <label className="mb-1 block text-xs text-slate-600">
                                {field.label}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                inputMode="decimal"
                                value={
                                  jawaban[
                                    getInputKey(transaksi.id, field.key)
                                  ] ?? ""
                                }
                                onChange={(e) =>
                                  updateJawaban(
                                    transaksi.id,
                                    field.key,
                                    e.target.value,
                                  )
                                }
                                placeholder="Masukkan angka"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-500">
              Pastikan seluruh jawaban sudah diperiksa sebelum dikirim.
            </div>

            <button
              onClick={submitJawaban}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={17} />
              )}
              {submitting ? "Mengirim..." : "Kumpulkan Jawaban"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

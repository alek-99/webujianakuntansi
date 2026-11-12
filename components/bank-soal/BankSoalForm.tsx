
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import type {
  BankSoal,
  BankSoalPayload,
  FieldKey,
  JenisTransaksi,
  TransaksiBankSoal,
} from "@/types/bank-soal";

interface Props {
  mode: "create" | "edit";
  id?: string;
}

const fieldOptions: { value: FieldKey; label: string }[] = [
  { value: "masuk_qty", label: "Masuk - Kuantitas" },
  { value: "masuk_harga", label: "Masuk - Harga Satuan" },
  { value: "masuk_total", label: "Masuk - Jumlah Harga" },
  { value: "keluar_qty", label: "Keluar - Kuantitas" },
  { value: "keluar_harga", label: "Keluar - Harga Satuan" },
  { value: "keluar_total", label: "Keluar - Jumlah Harga" },
  { value: "saldo_qty", label: "Saldo - Kuantitas" },
  { value: "saldo_harga", label: "Saldo - Harga Satuan" },
  { value: "saldo_total", label: "Saldo - Jumlah Harga" },
];

const jenisOptions: { value: JenisTransaksi; label: string }[] = [
  { value: "saldo_awal", label: "Saldo Awal" },
  { value: "pembelian", label: "Pembelian" },
  { value: "penjualan", label: "Penjualan" },
  { value: "retur_pembelian", label: "Retur Pembelian" },
  { value: "retur_penjualan", label: "Retur Penjualan" },
  { value: "penyesuaian", label: "Penyesuaian" },
  { value: "lainnya", label: "Lainnya" },
];

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function emptyTransaction(urutan: number): TransaksiBankSoal {
  return {
    urutan,
    tanggal: today(),
    keterangan: "",
    jenis_transaksi: "pembelian",
    jumlah: 0,
    harga_satuan: 0,
    kunci: [],
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function BankSoalForm({ mode, id }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    mata_pelajaran: "Akuntansi Keuangan",
    materi: "Kartu Persediaan",
    nama_barang: "",
    kode_barang: "",
    metode_persediaan: "perpetual" as "perpetual" | "periodik",
    metode_penilaian: "fifo" as "fifo" | "moving_average",
    saldo_awal_qty: 0,
    saldo_awal_harga: 0,
    tingkat_kesulitan: "sedang" as "mudah" | "sedang" | "sulit",
    status: "draft" as "draft" | "aktif" | "arsip",
  });

  const [transaksi, setTransaksi] = useState<TransaksiBankSoal[]>([
    emptyTransaction(1),
  ]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    async function loadData() {
      try {
        const response = await fetch(`/api/guru/bank-soal/${id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data.");
        }

        const data = result.data as BankSoal;

        setForm({
          judul: data.judul,
          deskripsi: data.deskripsi ?? "",
          mata_pelajaran: data.mata_pelajaran,
          materi: data.materi,
          nama_barang: data.nama_barang,
          kode_barang: data.kode_barang ?? "",
          metode_persediaan: data.metode_persediaan,
          metode_penilaian: data.metode_penilaian,
          saldo_awal_qty: Number(data.saldo_awal_qty),
          saldo_awal_harga: Number(data.saldo_awal_harga),
          tingkat_kesulitan: data.tingkat_kesulitan,
          status: data.status,
        });

        const rows = (data.bank_soal_transaksi ?? [])
          .sort((a, b) => a.urutan - b.urutan)
          .map((item) => ({
            id: item.id,
            urutan: item.urutan,
            tanggal: item.tanggal,
            keterangan: item.keterangan,
            jenis_transaksi: item.jenis_transaksi,
            jumlah: Number(item.jumlah),
            harga_satuan: Number(item.harga_satuan),
            kunci: (
              item.bank_soal_kunci_detail ??
              item.kunci ??
              []
            ).map((key) => ({
              id: key.id,
              field_key: key.field_key,
              nilai_benar: Number(key.nilai_benar),
              bobot: Number(key.bobot),
              toleransi: Number(key.toleransi),
            })),
          }));

        setTransaksi(rows.length ? rows : [emptyTransaction(1)]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mode, id]);

  function updateForm(
    field: keyof typeof form,
    value: string | number
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateTransaction(
    index: number,
    field: keyof TransaksiBankSoal,
    value: string | number
  ) {
    setTransaksi((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addTransaction() {
    setTransaksi((prev) => [
      ...prev,
      emptyTransaction(prev.length + 1),
    ]);
  }

  function removeTransaction(index: number) {
    if (transaksi.length <= 1) {
      setError("Minimal harus ada satu transaksi.");
      return;
    }

    setTransaksi((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, urutan: i + 1 }))
    );
  }

  function addKey(index: number) {
    setTransaksi((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              kunci: [
                ...item.kunci,
                {
                  field_key: "saldo_qty" as FieldKey,
                  nilai_benar: 0,
                  bobot: 1,
                  toleransi: 0,
                },
              ],
            }
          : item
      )
    );
  }

  function updateKey(
    transactionIndex: number,
    keyIndex: number,
    field: string,
    value: string | number
  ) {
    setTransaksi((prev) =>
      prev.map((item, i) =>
        i === transactionIndex
          ? {
              ...item,
              kunci: item.kunci.map((key, j) =>
                j === keyIndex
                  ? { ...key, [field]: value }
                  : key
              ),
            }
          : item
      )
    );
  }

  function removeKey(transactionIndex: number, keyIndex: number) {
    setTransaksi((prev) =>
      prev.map((item, i) =>
        i === transactionIndex
          ? {
              ...item,
              kunci: item.kunci.filter((_, j) => j !== keyIndex),
            }
          : item
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.judul.trim() ||
      !form.materi.trim() ||
      !form.nama_barang.trim()
    ) {
      setError("Judul, materi, dan nama barang wajib diisi.");
      return;
    }

    for (const [index, item] of transaksi.entries()) {
      if (!item.tanggal || !item.keterangan.trim()) {
        setError(`Lengkapi tanggal dan keterangan transaksi ${index + 1}.`);
        return;
      }

      if (
        !Number.isFinite(item.jumlah) ||
        !Number.isFinite(item.harga_satuan) ||
        item.jumlah < 0 ||
        item.harga_satuan < 0
      ) {
        setError(`Jumlah dan harga transaksi ${index + 1} tidak valid.`);
        return;
      }

      const keys = item.kunci.map((key) => key.field_key);
      if (new Set(keys).size !== keys.length) {
        setError(`Ada field kunci jawaban ganda di transaksi ${index + 1}.`);
        return;
      }

      if (
        item.kunci.some(
          (key) =>
            !Number.isFinite(key.nilai_benar) ||
            !Number.isFinite(key.bobot) ||
            !Number.isFinite(key.toleransi) ||
            key.bobot < 0 ||
            key.toleransi < 0
        )
      ) {
        setError(`Kunci jawaban transaksi ${index + 1} tidak valid.`);
        return;
      }
    }

    const payload: BankSoalPayload = {
      ...form,
      transaksi: transaksi.map((item, index) => ({
        urutan: index + 1,
        tanggal: item.tanggal,
        keterangan: item.keterangan.trim(),
        jenis_transaksi: item.jenis_transaksi,
        jumlah: Number(item.jumlah),
        harga_satuan: Number(item.harga_satuan),
        kunci: item.kunci.map((key) => ({
          field_key: key.field_key,
          nilai_benar: Number(key.nilai_benar),
          bobot: Number(key.bobot),
          toleransi: Number(key.toleransi),
        })),
      })),
    };

    setSaving(true);

    try {
      const response = await fetch(
        mode === "edit"
          ? `/api/guru/bank-soal/${id}`
          : "/api/guru/bank-soal",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan bank soal.");
      }

      router.push(
        mode === "edit"
          ? `/dashboard/guru/bank-soal/${id}`
          : "/dashboard/guru/bank-soal"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-700" size={28} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/guru/bank-soal"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft size={16} /> Kembali ke Bank Soal
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "edit" ? "Edit Bank Soal" : "Tambah Bank Soal"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola soal kartu persediaan dan kunci jawabannya.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Menyimpan..." : "Simpan Bank Soal"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* INFORMASI UTAMA */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList className="text-blue-700" size={20} />
          <h2 className="font-semibold text-slate-900">
            Informasi Bank Soal
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Judul Soal *</label>
            <input
              className={inputClass}
              value={form.judul}
              onChange={(e) => updateForm("judul", e.target.value)}
              placeholder="Contoh: Kartu Persediaan Barang Dagang"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Mata Pelajaran</label>
            <input
              className={inputClass}
              value={form.mata_pelajaran}
              onChange={(e) => updateForm("mata_pelajaran", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Materi *</label>
            <input
              className={inputClass}
              value={form.materi}
              onChange={(e) => updateForm("materi", e.target.value)}
              placeholder="Contoh: Metode FIFO"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Nama Barang *</label>
            <input
              className={inputClass}
              value={form.nama_barang}
              onChange={(e) => updateForm("nama_barang", e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Kode Barang</label>
            <input
              className={inputClass}
              value={form.kode_barang}
              onChange={(e) => updateForm("kode_barang", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Metode Persediaan</label>
            <select
              className={inputClass}
              value={form.metode_persediaan}
              onChange={(e) => updateForm("metode_persediaan", e.target.value)}
            >
              <option value="perpetual">Perpetual</option>
              <option value="periodik">Periodik</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Metode Penilaian</label>
            <select
              className={inputClass}
              value={form.metode_penilaian}
              onChange={(e) => updateForm("metode_penilaian", e.target.value)}
            >
              <option value="fifo">FIFO</option>
              <option value="moving_average">Rata-rata Bergerak</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Saldo Awal Kuantitas</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.saldo_awal_qty}
              onChange={(e) => updateForm("saldo_awal_qty", Number(e.target.value))}
            />
          </div>

          <div>
            <label className={labelClass}>Saldo Awal Harga Satuan</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.saldo_awal_harga}
              onChange={(e) => updateForm("saldo_awal_harga", Number(e.target.value))}
            />
          </div>

          <div>
            <label className={labelClass}>Tingkat Kesulitan</label>
            <select
              className={inputClass}
              value={form.tingkat_kesulitan}
              onChange={(e) => updateForm("tingkat_kesulitan", e.target.value)}
            >
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="aktif">Aktif</option>
              <option value="arsip">Arsip</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Deskripsi</label>
            <textarea
              rows={3}
              className={inputClass}
              value={form.deskripsi}
              onChange={(e) => updateForm("deskripsi", e.target.value)}
              placeholder="Petunjuk atau deskripsi soal..."
            />
          </div>
        </div>
      </section>

      {/* SALDO AWAL */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 font-semibold text-slate-900">
          Saldo Awal Persediaan
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Saldo awal digunakan sebagai dasar perhitungan kartu persediaan.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Kuantitas Awal</label>
            <input
              className={inputClass}
              value={form.saldo_awal_qty}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Harga Satuan Awal</label>
            <input
              className={inputClass}
              value={form.saldo_awal_harga}
              readOnly
            />
          </div>
        </div>
      </section>

      {/* TRANSAKSI */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Transaksi Persediaan
            </h2>
            <p className="text-sm text-slate-500">
              Masukkan urutan transaksi dan kunci jawaban setiap kolom.
            </p>
          </div>

          <button
            type="button"
            onClick={addTransaction}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Plus size={16} /> Tambah Transaksi
          </button>
        </div>

        {transaksi.map((item, index) => (
          <section
            key={item.id ?? `transaksi-${index}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h3 className="font-semibold text-slate-800">
                Transaksi #{index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeTransaction(index)}
                className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 size={15} /> Hapus
              </button>
            </div>

            <div className="space-y-5 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Tanggal</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={item.tanggal}
                    onChange={(e) =>
                      updateTransaction(index, "tanggal", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Jenis Transaksi</label>
                  <select
                    className={inputClass}
                    value={item.jenis_transaksi}
                    onChange={(e) =>
                      updateTransaction(index, "jenis_transaksi", e.target.value)
                    }
                  >
                    {jenisOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Keterangan</label>
                  <input
                    className={inputClass}
                    value={item.keterangan}
                    onChange={(e) =>
                      updateTransaction(index, "keterangan", e.target.value)
                    }
                    placeholder="Contoh: Pembelian barang"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Jumlah Barang</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.jumlah}
                    onChange={(e) =>
                      updateTransaction(index, "jumlah", Number(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Harga Satuan</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.harga_satuan}
                    onChange={(e) =>
                      updateTransaction(index, "harga_satuan", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      Kunci Jawaban
                    </h4>
                    <p className="text-xs text-slate-500">
                      Isi nilai benar untuk setiap kolom kartu persediaan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addKey(index)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <Plus size={14} /> Tambah Kunci
                  </button>
                </div>

                {item.kunci.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                    Belum ada kunci jawaban untuk transaksi ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {item.kunci.map((key, keyIndex) => (
                      <div
                        key={`${index}-${keyIndex}`}
                        className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4"
                      >
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className={labelClass}>Kolom Kartu</label>
                          <select
                            className={inputClass}
                            value={key.field_key}
                            onChange={(e) =>
                              updateKey(
                                index,
                                keyIndex,
                                "field_key",
                                e.target.value
                              )
                            }
                          >
                            {fieldOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Nilai Benar</label>
                          <input
                            type="number"
                            step="0.01"
                            className={inputClass}
                            value={key.nilai_benar}
                            onChange={(e) =>
                              updateKey(
                                index,
                                keyIndex,
                                "nilai_benar",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Bobot</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            className={inputClass}
                            value={key.bobot}
                            onChange={(e) =>
                              updateKey(index, keyIndex, "bobot", Number(e.target.value))
                            }
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <div className="min-w-0 flex-1">
                            <label className={labelClass}>Toleransi</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={inputClass}
                              value={key.toleransi}
                              onChange={(e) =>
                                updateKey(
                                  index,
                                  keyIndex,
                                  "toleransi",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeKey(index, keyIndex)}
                            className="mb-0.5 rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50"
                            title="Hapus kunci"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/dashboard/guru/bank-soal"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Menyimpan..." : "Simpan Bank Soal"}
        </button>
      </div>
    </form>
  );
}

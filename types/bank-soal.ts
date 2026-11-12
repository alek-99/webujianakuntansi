
export type MetodePersediaan = "perpetual" | "periodik";

export type MetodePenilaian = "fifo" | "moving_average";

export type TingkatKesulitan = "mudah" | "sedang" | "sulit";

export type StatusBankSoal = "draft" | "aktif" | "arsip";

export type JenisTransaksi =
  | "saldo_awal"
  | "pembelian"
  | "penjualan"
  | "retur_pembelian"
  | "retur_penjualan"
  | "penyesuaian"
  | "lainnya";

export type FieldKey =
  | "masuk_qty"
  | "masuk_harga"
  | "masuk_total"
  | "keluar_qty"
  | "keluar_harga"
  | "keluar_total"
  | "saldo_qty"
  | "saldo_harga"
  | "saldo_total";

export interface KunciJawaban {
  id?: string;
  field_key: FieldKey;
  nilai_benar: number;
  bobot: number;
  toleransi: number;
}

export interface TransaksiBankSoal {
  id?: string;
  urutan: number;
  tanggal: string;
  keterangan: string;
  jenis_transaksi: JenisTransaksi;
  jumlah: number;
  harga_satuan: number;
  bank_soal_kunci_detail?: KunciJawaban[];
  kunci: KunciJawaban[];
}

export interface BankSoal {
  id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  mata_pelajaran: string;
  materi: string;
  nama_barang: string;
  kode_barang: string | null;
  metode_persediaan: MetodePersediaan;
  metode_penilaian: MetodePenilaian;
  saldo_awal_qty: number;
  saldo_awal_harga: number;
  tingkat_kesulitan: TingkatKesulitan;
  status: StatusBankSoal;
  created_at: string;
  updated_at: string;
  bank_soal_transaksi?: TransaksiBankSoal[];
}

export interface BankSoalPayload {
  judul: string;
  deskripsi: string;
  mata_pelajaran: string;
  materi: string;
  nama_barang: string;
  kode_barang: string;
  metode_persediaan: MetodePersediaan;
  metode_penilaian: MetodePenilaian;
  saldo_awal_qty: number;
  saldo_awal_harga: number;
  tingkat_kesulitan: TingkatKesulitan;
  status: StatusBankSoal;
  transaksi: {
    urutan: number;
    tanggal: string;
    keterangan: string;
    jenis_transaksi: JenisTransaksi;
    jumlah: number;
    harga_satuan: number;
    kunci: {
      field_key: FieldKey;
      nilai_benar: number;
      bobot: number;
      toleransi: number;
    }[];
  }[];
}

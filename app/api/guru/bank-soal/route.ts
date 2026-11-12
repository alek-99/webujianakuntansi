
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TransactionInput = {
  urutan: number;
  tanggal: string;
  keterangan: string;
  jenis_transaksi: string;
  jumlah: number;
  harga_satuan: number;
  kunci?: {
    field_key: string;
    nilai_benar: number;
    bobot?: number;
    toleransi?: number;
  }[];
};

type BankSoalInput = {
  judul: string;
  deskripsi?: string;
  mata_pelajaran?: string;
  materi: string;
  nama_barang: string;
  kode_barang?: string;
  metode_persediaan: "perpetual" | "periodik";
  metode_penilaian: "fifo" | "moving_average";
  saldo_awal_qty: number;
  saldo_awal_harga: number;
  tingkat_kesulitan: "mudah" | "sedang" | "sulit";
  status: "draft" | "aktif" | "arsip";
  transaksi: TransactionInput[];
};

async function getUserContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      role: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status_aktif")
    .eq("id", user.id)
    .single();

  if (!profile?.status_aktif) {
    return {
      supabase,
      user: null,
      role: null,
    };
  }

  return {
    supabase,
    user,
    role: profile.role,
  };
}

function validateInput(body: BankSoalInput) {
  if (
    !body.judul?.trim() ||
    !body.materi?.trim() ||
    !body.nama_barang?.trim()
  ) {
    return "Judul, materi, dan nama barang wajib diisi.";
  }

  if (
    !["perpetual", "periodik"].includes(body.metode_persediaan) ||
    !["fifo", "moving_average"].includes(body.metode_penilaian)
  ) {
    return "Metode persediaan atau metode penilaian tidak valid.";
  }

  if (!Array.isArray(body.transaksi) || body.transaksi.length === 0) {
    return "Minimal harus ada satu transaksi.";
  }

  for (const [index, item] of body.transaksi.entries()) {
    if (
      !item.tanggal ||
      !item.keterangan?.trim() ||
      !Number.isFinite(Number(item.jumlah)) ||
      !Number.isFinite(Number(item.harga_satuan))
    ) {
      return `Data transaksi nomor ${index + 1} tidak valid.`;
    }

    if (!Array.isArray(item.kunci)) {
      return `Kunci jawaban transaksi nomor ${index + 1} tidak valid.`;
    }
  }

  return null;
}

async function insertTransactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bankSoalId: string,
  transaksi: TransactionInput[]
) {
  for (const item of transaksi) {
    const { data: transaction, error } = await supabase
      .from("bank_soal_transaksi")
      .insert({
        bank_soal_id: bankSoalId,
        urutan: item.urutan,
        tanggal: item.tanggal,
        keterangan: item.keterangan,
        jenis_transaksi: item.jenis_transaksi,
        jumlah: item.jumlah,
        harga_satuan: item.harga_satuan,
      })
      .select("id")
      .single();

    if (error || !transaction) {
      throw new Error(error?.message || "Gagal menyimpan transaksi.");
    }

    if (item.kunci.length > 0) {
      const keys = item.kunci.map((key) => ({
        transaksi_id: transaction.id,
        field_key: key.field_key,
        nilai_benar: key.nilai_benar,
        bobot: key.bobot ?? 1,
        toleransi: key.toleransi ?? 0,
      }));

      const { error: keyError } = await supabase
        .from("bank_soal_kunci_detail")
        .insert(keys);

      if (keyError) {
        throw new Error(keyError.message);
      }
    }
  }
}

// GET: Menampilkan seluruh bank soal milik guru.
export async function GET() {
  const { supabase, user, role } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  if (!["guru", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Anda tidak memiliki akses." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("bank_soal")
    .select(`
      *,
      bank_soal_transaksi (
        id,
        urutan,
        tanggal,
        keterangan,
        jenis_transaksi,
        jumlah,
        harga_satuan
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

// POST: Membuat bank soal beserta transaksi dan kuncinya.
export async function POST(request: NextRequest) {
  const { supabase, user, role } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  if (!["guru", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Anda tidak memiliki akses." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as BankSoalInput;
    const validationError = validateInput(body);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    const { data: bankSoal, error } = await supabase
      .from("bank_soal")
      .insert({
        guru_id: user.id,
        judul: body.judul.trim(),
        deskripsi: body.deskripsi ?? null,
        mata_pelajaran: body.mata_pelajaran ?? "Akuntansi Keuangan",
        materi: body.materi.trim(),
        nama_barang: body.nama_barang.trim(),
        kode_barang: body.kode_barang ?? null,
        metode_persediaan: body.metode_persediaan,
        metode_penilaian: body.metode_penilaian,
        saldo_awal_qty: body.saldo_awal_qty,
        saldo_awal_harga: body.saldo_awal_harga,
        tingkat_kesulitan: body.tingkat_kesulitan,
        status: body.status,
      })
      .select("id")
      .single();

    if (error || !bankSoal) {
      return NextResponse.json(
        { message: error?.message ?? "Gagal membuat bank soal." },
        { status: 400 }
      );
    }

    try {
      await insertTransactions(
        supabase,
        bankSoal.id,
        body.transaksi
      );
    } catch (transactionError) {
      // Hapus data utama jika penyimpanan detail gagal.
      await supabase
        .from("bank_soal")
        .delete()
        .eq("id", bankSoal.id);

      throw transactionError;
    }

    return NextResponse.json(
      {
        message: "Bank soal berhasil ditambahkan.",
        id: bankSoal.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan.",
      },
      { status: 500 }
    );
  }
}

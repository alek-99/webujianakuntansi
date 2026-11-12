
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

async function getContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status_aktif")
    .eq("id", user.id)
    .single();

  if (!profile?.status_aktif) {
    return { supabase, user: null, role: null };
  }

  return {
    supabase,
    user,
    role: profile.role,
  };
}

// GET: Detail bank soal, transaksi, dan kunci jawaban.
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const { supabase, user, role } = await getContext();

  if (!user) {
    return NextResponse.json(
      { message: "Belum login." },
      { status: 401 }
    );
  }

  if (!["guru", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Tidak memiliki akses." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("bank_soal")
    .select(`
      *,
      bank_soal_transaksi (
        *,
        bank_soal_kunci_detail (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { message: "Bank soal tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// PATCH: Mengubah data utama dan mengganti seluruh detail transaksi.
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { supabase, user, role } = await getContext();

  if (!user) {
    return NextResponse.json(
      { message: "Belum login." },
      { status: 401 }
    );
  }

  if (!["guru", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Tidak memiliki akses." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const { data: existing } = await supabase
      .from("bank_soal")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { message: "Bank soal tidak ditemukan." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("bank_soal")
      .update({
        judul: body.judul,
        deskripsi: body.deskripsi ?? null,
        mata_pelajaran: body.mata_pelajaran,
        materi: body.materi,
        nama_barang: body.nama_barang,
        kode_barang: body.kode_barang ?? null,
        metode_persediaan: body.metode_persediaan,
        metode_penilaian: body.metode_penilaian,
        saldo_awal_qty: body.saldo_awal_qty,
        saldo_awal_harga: body.saldo_awal_harga,
        tingkat_kesulitan: body.tingkat_kesulitan,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Menghapus transaksi lama.
    // Kunci jawaban ikut terhapus melalui ON DELETE CASCADE.
    const { error: deleteError } = await supabase
      .from("bank_soal_transaksi")
      .delete()
      .eq("bank_soal_id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Simpan kembali transaksi dan kunci yang baru.
    for (const item of body.transaksi ?? []) {
      const { data: transaction, error } = await supabase
        .from("bank_soal_transaksi")
        .insert({
          bank_soal_id: id,
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
        throw new Error(error?.message ?? "Gagal menyimpan transaksi.");
      }

      if (item.kunci?.length) {
        const keys = item.kunci.map((key: {
          field_key: string;
          nilai_benar: number;
          bobot?: number;
          toleransi?: number;
        }) => ({
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

    return NextResponse.json({
      message: "Bank soal berhasil diperbarui.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui bank soal.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus bank soal dan seluruh detailnya.
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const { supabase, user, role } = await getContext();

  if (!user) {
    return NextResponse.json(
      { message: "Belum login." },
      { status: 401 }
    );
  }

  if (!["guru", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Tidak memiliki akses." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("bank_soal")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "Bank soal berhasil dihapus.",
  });
}

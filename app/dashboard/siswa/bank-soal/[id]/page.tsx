
import BankSoalSiswaDetail from "@/components/bank-soal-siswa/BankSoalSiswaDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetailBankSoalSiswaPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl">
      <BankSoalSiswaDetail id={id} />
    </div>
  );
}

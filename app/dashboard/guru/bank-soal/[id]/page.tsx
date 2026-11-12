
import BankSoalDetail from "@/components/bank-soal/BankSoalDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetailBankSoalPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl">
      <BankSoalDetail id={id} />
    </div>
  );
}

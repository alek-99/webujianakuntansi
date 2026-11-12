
import BankSoalForm from "@/components/bank-soal/BankSoalForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBankSoalPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl">
      <BankSoalForm mode="edit" id={id} />
    </div>
  );
}

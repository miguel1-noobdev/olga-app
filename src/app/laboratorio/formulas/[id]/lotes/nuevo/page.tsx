import { notFound, redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';

interface PageProps {
  params: { id: string };
}

export default async function LegacyLotCreatePage({ params }: PageProps) {
  await connectToDatabase();
  const formula = await createFormulaRepository().findById(params.id);

  if (!formula || formula.status !== 'validated') {
    notFound();
  }

  redirect(`/laboratorio/lotes/nuevo?formulaId=${formula.id}`);
}

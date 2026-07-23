import { notFound, redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';

interface PageProps {
  params: { id: string; lotId: string };
}

export const dynamic = 'force-dynamic';

export default async function LegacyLotEditPage({ params }: PageProps) {
  await connectToDatabase();
  const lot = await createLotRepository().findById(params.lotId);

  if (!lot || lot.formulaId !== params.id) {
    notFound();
  }

  redirect(`/laboratorio/lotes/${lot.id}/editar`);
}

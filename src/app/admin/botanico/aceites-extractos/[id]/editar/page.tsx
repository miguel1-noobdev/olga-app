import { notFound } from 'next/navigation';
import BotanicalEntryForm from '@/components/admin/botanical-entry-form';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';

export const dynamic = 'force-dynamic';

export default async function EditOilPage({ params }: { params: { id: string } }) {
  await connectToDatabase();
  const oil = await createOilRepository().findById(params.id);
  if (!oil) notFound();

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-on-surface">Editar aceite o extracto</h1>
          <p className="text-on-surface-variant">Actualizá el material canónico compartido con Laboratorio.</p>
        </div>
        <BotanicalEntryForm kind="oils" entryId={oil.id} initialValues={oil} />
      </div>
    </main>
  );
}

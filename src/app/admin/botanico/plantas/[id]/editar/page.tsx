import { notFound } from 'next/navigation';
import BotanicalEntryForm from '@/components/admin/botanical-entry-form';
import { connectToDatabase } from '@/lib/db/connect';
import { createPlantRepository } from '@/lib/db/repository/plant';

export const dynamic = 'force-dynamic';

export default async function EditPlantPage({ params }: { params: { id: string } }) {
  await connectToDatabase();
  const plant = await createPlantRepository().findById(params.id);
  if (!plant) notFound();

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-on-surface">Editar planta</h1>
          <p className="text-on-surface-variant">Actualizá la ficha canónica compartida con Laboratorio.</p>
        </div>
        <BotanicalEntryForm kind="plants" entryId={plant.id} initialValues={plant} />
      </div>
    </main>
  );
}

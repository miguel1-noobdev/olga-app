import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFullPlantRepository } from '@/lib/plantas/full-domain';
import PlantInternalDetail from '@/components/laboratorio/plant-internal-detail';
import { updatePlantNotes } from './actions';

interface PageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export default async function LaboratoryPlantDetailPage({ params }: PageProps) {
  await connectToDatabase();
  const plant = await createFullPlantRepository().findBySlug(params.slug);

  if (!plant) {
    notFound();
  }

  const submitPlantNotes = updatePlantNotes.bind(null, plant.id, plant.slug);

  return (
    <main className="flex-1 bg-surface px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link href="/laboratorio/plantas" className="mb-4 inline-flex items-center gap-2 font-label text-sm text-primary transition-colors hover:text-primary-dim">
          <span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a Mi jardín
        </Link>
        <PlantInternalDetail plant={plant} submitPlantNotes={submitPlantNotes} />
      </div>
    </main>
  );
}

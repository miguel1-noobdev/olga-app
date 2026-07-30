import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFullPlantRepository } from '@/lib/plantas/full-domain';
import PlantInternalDetail from '@/components/laboratorio/plant-internal-detail';
import { updatePlantNotes } from './actions';
import { LaboratoryIcon } from '@/components/ui/icons';

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export const dynamic = 'force-dynamic';

export default async function LaboratoryPlantDetailPage(props: PageProps) {
  const params = await props.params;
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
          <LaboratoryIcon name="arrow_back" className="h-4 w-4" />
          Volver a Mi jardín
        </Link>
        <PlantInternalDetail plant={plant} submitPlantNotes={submitPlantNotes} />
      </div>
    </main>
  );
}

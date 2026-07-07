import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createPlantRepository } from '@/lib/db/repository/plant';
import PlantDetail from '@/components/jardin-digital/plant-detail';

interface PageProps {
  params: { slug: string };
}

export default async function PlantDetailPage({ params }: PageProps) {
  await connectToDatabase();
  const repo = createPlantRepository();
  const plant = await repo.findBySlug(params.slug);

  if (!plant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/jardin-digital"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 font-sans text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al catálogo
        </Link>

        <PlantDetail plant={plant} />
      </div>
    </div>
  );
}

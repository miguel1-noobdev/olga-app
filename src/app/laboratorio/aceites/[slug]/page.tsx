import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import OilInternalDetail from '@/components/laboratorio/oil-internal-detail';
import { updateOilNotes } from './actions';

export default async function LaboratoryOilDetailPage({ params }: { params: { slug: string } }) {
  await connectToDatabase();
  const oil = await createOilRepository().findBySlug(params.slug);
  if (!oil) notFound();
  return <main className="flex-1 bg-surface px-6 py-8 lg:px-10 lg:py-10"><div className="mx-auto w-full max-w-7xl"><Link href="/laboratorio/aceites" className="mb-4 inline-flex items-center gap-2 font-label text-sm text-primary transition-colors hover:text-primary-dim"><span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_back</span>Volver a Mis aceites</Link><OilInternalDetail oil={oil} submitOilNotes={updateOilNotes.bind(null, oil.id, oil.slug)} /></div></main>;
}

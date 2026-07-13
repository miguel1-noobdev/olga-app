import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
  getLotLifecyclePermissions,
  toLotEditFormValues,
} from '@/lib/lots/lot-edit-form-contract';
import LotEditForm from '@/components/laboratorio/lot-edit-form';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { submitLotEditUpdate } from './actions';

interface PageProps {
  params: { lotId: string };
}

export default async function LaboratoryLotEditPage({ params }: PageProps) {
  await connectToDatabase();
  const lot = await createLotRepository().findById(params.lotId);

  if (!lot) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/laboratorio/lotes/${lot.id}`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to lot
        </Link>
        <section className="glass-card rounded-xl p-8">
          <h1 className="font-serif text-3xl text-on-surface mb-2">Edit lot</h1>
          <p className="font-sans text-on-surface-variant mb-6">{lot.lotCode}</p>
          <LotEditForm
            initialValues={toLotEditFormValues(lot)}
            permissions={getLotLifecyclePermissions(lot.status)}
            submitLotEdit={submitLotEditUpdate.bind(null, lot.id)}
          />
        </section>
      </div>
    </main>
  );
}

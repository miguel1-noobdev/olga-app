import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { toLotEditFormValues } from '@/lib/lots/lot-edit-form-contract';
import LotEditForm from '@/components/laboratorio/lot-edit-form';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { submitLotEditUpdate } from './actions';

interface PageProps {
  params: { id: string; lotId: string };
}

export default async function LaboratoryEditLotPage({ params }: PageProps) {
  await connectToDatabase();
  const formulaRepo = createFormulaRepository();
  const lotRepo = createLotRepository();

  const formula = await formulaRepo.findById(params.id);

  if (!formula) {
    notFound();
  }

  const lot = await lotRepo.findById(params.lotId);

  if (!lot || lot.formulaId !== formula.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/laboratorio/formulas/${formula.id}/lotes/${lot.id}`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to lot
          </Link>
        </div>

        <section className="glass-card rounded-xl p-8">
          <h1 className="font-serif text-3xl text-on-surface mb-2">Edit lot</h1>
          <p className="font-sans text-on-surface-variant mb-6">
            {lot.lotCode} — {formula.productName}
          </p>

          <LotEditForm
            initialValues={toLotEditFormValues(lot)}
            submitLotEdit={submitLotEditUpdate.bind(null, lot.id)}
          />
        </section>
      </div>
    </main>
  );
}

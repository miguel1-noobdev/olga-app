import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { ArrowLeftIcon } from '@/components/ui/icons';
import LotForm from '@/components/laboratorio/lot-form';
import { submitLot } from './actions';

interface PageProps {
  params: { id: string };
}

export default async function LaboratoryCreateLotPage({ params }: PageProps) {
  await connectToDatabase();
  const repository = createFormulaRepository();
  const formula = await repository.findById(params.id);

  if (!formula) {
    notFound();
  }

  if (formula.status !== 'validated') {
    redirect(`/laboratorio/formulas/${formula.id}`);
  }

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/laboratorio/formulas/${formula.id}`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to formula
        </Link>

        <section className="glass-card rounded-xl p-8">
          <h1 className="font-serif text-3xl text-on-surface mb-2">Create lot</h1>
          <p className="font-sans text-on-surface-variant mb-6">
            New production lot from source formula.
          </p>

          <LotForm formula={formula} submitLot={(values) => submitLot(formula.id, values)} />
        </section>
      </div>
    </main>
  );
}

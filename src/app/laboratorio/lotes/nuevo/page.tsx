import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import LotCreationForm from '@/components/laboratorio/lot-creation-form';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { submitNewLot } from './actions';

interface PageProps {
  searchParams: { formulaId?: string };
}

export default async function LaboratoryCreateLotPage({ searchParams }: PageProps) {
  await connectToDatabase();
  const formulas = await createFormulaRepository().findByStatus('validated');

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/laboratorio/lotes"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to lots
        </Link>

        <section className="glass-card rounded-xl p-8">
          <h1 className="font-serif text-3xl text-on-surface mb-2">Create lot</h1>
          <p className="font-sans text-on-surface-variant mb-6">
            Select a validated formula and set the target batch weight.
          </p>

          {formulas.length === 0 ? (
            <p className="font-sans text-on-surface-variant">
              No validated formulas are available for lot creation.
            </p>
          ) : (
            <LotCreationForm
              formulas={formulas}
              preselectedFormulaId={searchParams.formulaId}
              submitLot={submitNewLot}
            />
          )}
        </section>
      </div>
    </main>
  );
}

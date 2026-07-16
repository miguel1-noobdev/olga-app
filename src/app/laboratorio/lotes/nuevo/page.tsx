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
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a lotes
        </Link>

        <section className="bg-surface-container border border-surface-border rounded-2xl p-8">
          <h1 className="font-headline text-3xl text-on-surface mb-2">Crear lote</h1>
          <p className="font-body text-on-surface-variant mb-6">
            Seleccioná una fórmula validada y establecé el peso objetivo del lote.
          </p>

          {formulas.length === 0 ? (
            <p className="font-body text-on-surface-variant">
              No hay fórmulas validadas disponibles para crear un lote.
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

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import LotCreationForm from '@/components/laboratorio/lot-creation-form';
import {
  formatDate,
  FORMULA_STATUS_LABELS,
  getFormulaStatusStyles,
} from '@/components/laboratorio/shared-presentation';
import { ArrowLeftIcon } from '@/components/ui/icons';
import type { FormulaRecord } from '@/lib/formulas/formula-types';
import { submitNewLot } from './actions';

interface PageProps {
  searchParams: { formulaId?: string };
}

export default async function LaboratoryCreateLotPage({ searchParams }: PageProps) {
  await connectToDatabase();
  const formulas = (await createFormulaRepository().findByStatus('validated')).filter(
    (formula) => formula.status === 'validated'
  );
  const selectedFormula = searchParams.formulaId
    ? formulas.find((formula) => formula.id === searchParams.formulaId)
    : undefined;

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/laboratorio/lotes"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a lotes
        </Link>

        <section className="rounded-2xl border border-surface-border bg-surface-container p-6 sm:p-8">
          <h1 className="mb-2 font-headline text-3xl text-on-surface">Nuevo lote</h1>
          <p className="mb-8 font-body text-on-surface-variant">
            {selectedFormula
              ? 'Revisá la fórmula heredada y establecé el peso objetivo del lote.'
              : 'Seleccioná una fórmula validada para comenzar un lote.'}
          </p>

          {formulas.length === 0 ? (
            <p className="font-body text-on-surface-variant">
              No hay fórmulas validadas disponibles para crear un lote.
            </p>
          ) : selectedFormula ? (
            <LotCreationForm
              formula={selectedFormula}
              submitLot={submitNewLot}
            />
          ) : (
            <FormulaSelection formulas={formulas} />
          )}
        </section>
      </div>
    </main>
  );
}

function FormulaSelection({ formulas }: { formulas: FormulaRecord[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Fórmulas validadas">
      {formulas.map((formula) => (
        <li key={formula.id} className="min-w-0 h-full">
          <article className="flex h-full min-w-0 flex-col rounded-lg border border-outline-variant bg-surface-container p-6 transition-colors hover:border-primary/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span
                  className="material-symbols-outlined text-3xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  science
                </span>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-label font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}>
                {FORMULA_STATUS_LABELS[formula.status]}
              </span>
            </div>

            <div className="mt-6 min-w-0 flex-1">
              <h2 className="break-words font-headline text-xl font-bold text-on-surface">{formula.productName}</h2>
              <dl className="mt-4 grid grid-cols-1 gap-2 font-body text-sm text-on-surface-variant">
                <div className="flex min-w-0 justify-between gap-4">
                  <dt className="font-medium text-on-surface">Código</dt>
                  <dd className="min-w-0 break-all text-right">{formula.formulaCode}</dd>
                </div>
                <div className="flex min-w-0 justify-between gap-4">
                  <dt className="font-medium text-on-surface">Versión</dt>
                  <dd className="min-w-0 break-words text-right">v{formula.formulaVersion}</dd>
                </div>
                <div className="flex min-w-0 justify-between gap-4">
                  <dt className="font-medium text-on-surface">Tipo</dt>
                  <dd className="min-w-0 break-words text-right">{formula.productType}</dd>
                </div>
                <div className="flex min-w-0 justify-between gap-4">
                  <dt className="font-medium text-on-surface">Creada</dt>
                  <dd className="min-w-0 break-words text-right">{formatDate(formula.formulaCreatedAt)}</dd>
                </div>
                <div className="flex min-w-0 justify-between gap-4">
                  <dt className="font-medium text-on-surface">Objetivo</dt>
                  <dd className="min-w-0 break-words text-right">{formula.targetBatchGrams} g</dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 border-t border-outline-variant pt-4">
              <Link
                href={`/laboratorio/lotes/nuevo?formulaId=${formula.id}`}
                className="inline-flex w-full items-center justify-center rounded-DEFAULT bg-primary px-5 py-3 font-label text-sm font-bold text-on-primary-container shadow-[0_0_15px_rgba(150,248,255,0.15)] transition-colors hover:bg-primary-dim hover:shadow-[0_0_20px_rgba(150,248,255,0.3)]"
              >
                Crear lote
              </Link>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

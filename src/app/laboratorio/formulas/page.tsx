import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import {
  formatDate,
  FORMULA_STATUS_LABELS,
  getFormulaStatusStyles,
} from '@/components/laboratorio/shared-presentation';
import { ArrowRightIcon, FlaskIcon, ArrowLeftIcon, PlusIcon } from '@/components/ui/icons';

export default async function LaboratoryFormulasPage() {
  await connectToDatabase();
  const repo = createFormulaRepository();
  const formulas = await repo.findAll();

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 space-y-4">
          <Link
            href="/laboratorio"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al laboratorio
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-headline text-4xl text-on-surface mb-2">
                Laboratorio — Fórmulas
              </h1>
              <p className="font-body text-lg text-on-surface-variant">
                Fórmulas disponibles para producción
              </p>
            </div>

            <Link
              href="/laboratorio/formulas/nueva"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary-container font-label text-sm font-medium hover:bg-primary-dim transition-colors shadow-[0_0_15px_rgba(150,248,255,0.15)] hover:shadow-[0_0_20px_rgba(150,248,255,0.3)]"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva fórmula
            </Link>
          </div>
        </div>

        {formulas.length === 0 ? (
          <div className="bg-surface-container border border-surface-border rounded-2xl p-12 text-center">
            <FlaskIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-body text-lg text-on-surface font-medium mb-1">
              No hay fórmulas registradas todavía
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              Tus fórmulas del laboratorio aparecerán aquí una vez creadas.
            </p>
          </div>
        ) : (
          <ul className="space-y-4" role="list">
            {formulas.map((formula) => (
              <li key={formula.id}>
                <Link
                  href={`/laboratorio/formulas/${formula.id}`}
                  aria-label={`Ver detalles de ${formula.productName}`}
                  className="bg-surface-container border border-surface-border rounded-2xl p-6 block hover:no-underline group hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-headline text-xl text-on-surface mb-2">
                        {formula.productName}
                      </h2>
                      <dl className="flex flex-wrap gap-x-6 gap-y-1 font-body text-sm text-on-surface-variant">
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Código:</dt>
                          <dd>{formula.formulaCode}</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Versión:</dt>
                          <dd>{formula.formulaVersion}</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Creada:</dt>
                          <dd>{formatDate(formula.formulaCreatedAt)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0">
                      <span
                        className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-label font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}
                      >
                        {FORMULA_STATUS_LABELS[formula.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-body font-medium text-primary group-hover:underline">
                        Ver detalles
                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

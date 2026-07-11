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
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to laboratory
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl text-on-surface mb-2">
                Laboratory — Formulas
              </h1>
              <p className="font-sans text-lg text-on-surface-variant">
                Available formulas for production
              </p>
            </div>

            <Link
              href="/laboratorio/formulas/nueva"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New formula
            </Link>
          </div>
        </div>

        {formulas.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <FlaskIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-sans text-lg text-on-surface font-medium mb-1">
              No formulas registered yet
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              Your laboratory formulas will appear here once they are created.
            </p>
          </div>
        ) : (
          <ul className="space-y-4" role="list">
            {formulas.map((formula) => (
              <li key={formula.id}>
                <Link
                  href={`/laboratorio/formulas/${formula.id}`}
                  aria-label={`View details for ${formula.productName}`}
                  className="glass-card rounded-xl p-6 block hover:no-underline group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-xl text-on-surface mb-2">
                        {formula.productName}
                      </h2>
                      <dl className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-on-surface-variant">
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Code:</dt>
                          <dd>{formula.formulaCode}</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Version:</dt>
                          <dd>{formula.formulaVersion}</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-medium text-on-surface">Created:</dt>
                          <dd>{formatDate(formula.formulaCreatedAt)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0">
                      <span
                        className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}
                      >
                        {FORMULA_STATUS_LABELS[formula.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-sans font-medium text-primary group-hover:underline">
                        View details
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

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import {
  formatDate,
  FORMULA_STATUS_LABELS,
  getFormulaStatusStyles,
} from '@/components/laboratorio/shared-presentation';
import type { FormulaStatus } from '@/lib/formulas/formula-types';
import { ArrowRightIcon, FlaskIcon, PlusIcon } from '@/components/ui/icons';

const FORMULA_STATUS_PRESENTATION: Record<
  FormulaStatus,
  { icon: string; iconClass: string; iconBackground: string }
> = {
  validated: {
    icon: 'science',
    iconClass: 'text-primary',
    iconBackground: 'bg-primary/10',
  },
  testing: {
    icon: 'biotech',
    iconClass: 'text-secondary',
    iconBackground: 'bg-secondary/10',
  },
  draft: {
    icon: 'edit_note',
    iconClass: 'text-tertiary',
    iconBackground: 'bg-tertiary/10',
  },
  archived: {
    icon: 'archive',
    iconClass: 'text-on-surface-variant',
    iconBackground: 'bg-surface-container-high',
  },
  discarded: {
    icon: 'cancel',
    iconClass: 'text-error',
    iconBackground: 'bg-error/10',
  },
};

export default async function LaboratoryFormulasPage() {
  await connectToDatabase();
  const repo = createFormulaRepository();
  const formulas = await repo.findAll();

  return (
    <main className="flex-1 min-w-0 container mx-auto px-6 py-12 max-w-7xl">
      <div className="min-w-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface tracking-tight">
              Fórmulas
            </h1>
            <p className="font-body text-on-surface-variant mt-2 text-lg">
              Gestión y control de fórmulas en producción
            </p>
          </div>

          <Link
            href="/laboratorio/formulas/nueva"
            className="bg-primary text-on-primary-container hover:bg-primary-dim transition-colors duration-200 px-5 py-2.5 rounded-DEFAULT font-label font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(150,248,255,0.15)] hover:shadow-[0_0_20px_rgba(150,248,255,0.3)] w-fit"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva fórmula
          </Link>
        </header>

        {formulas.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded-lg p-12 text-center">
            <FlaskIcon className="w-14 h-14 mx-auto mb-5 text-on-surface-variant" />
            <p className="font-headline text-xl text-on-surface font-bold mb-2">
              Todavía no hay fórmulas registradas
            </p>
            <p className="font-body text-sm text-on-surface-variant max-w-lg mx-auto">
              Tus fórmulas aparecerán aquí cuando las crees. Comienza diseñando un nuevo producto para tu
              laboratorio.
            </p>
            <Link
              href="/laboratorio/formulas/nueva"
              className="mt-6 inline-flex items-center gap-2 bg-primary text-on-primary-container hover:bg-primary-dim transition-colors duration-200 px-5 py-2.5 rounded-DEFAULT font-label font-medium"
            >
              Crear primera fórmula
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            </Link>
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label="Lista de fórmulas"
          >
            {formulas.map((formula) => {
              const presentation = FORMULA_STATUS_PRESENTATION[formula.status];

              return (
                <li key={formula.id} className="min-w-0 h-full">
                  <Link
                    href={`/laboratorio/formulas/${formula.id}`}
                    aria-label={`Ver detalles de ${formula.productName}`}
                    className="bg-surface-container border border-outline-variant rounded-lg p-6 flex h-full min-w-0 flex-col hover:no-underline group hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${presentation.iconBackground}`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl ${presentation.iconClass}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {presentation.icon}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-label font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}
                      >
                        {FORMULA_STATUS_LABELS[formula.status]}
                      </span>
                    </div>

                    <div className="mt-6 flex-1 min-w-0">
                      <h2 className="font-headline text-xl text-on-surface font-bold break-words">
                        {formula.productName}
                      </h2>
                      <dl className="mt-4 grid grid-cols-1 gap-2 font-body text-sm text-on-surface-variant">
                        <div className="flex min-w-0 justify-between gap-4">
                          <dt className="font-medium text-on-surface">Código</dt>
                          <dd className="min-w-0 break-all text-right">{formula.formulaCode}</dd>
                        </div>
                        <div className="flex min-w-0 justify-between gap-4">
                          <dt className="font-medium text-on-surface">Versión</dt>
                          <dd className="min-w-0 break-words text-right">{formula.formulaVersion}</dd>
                        </div>
                        <div className="flex min-w-0 justify-between gap-4">
                          <dt className="font-medium text-on-surface">Creada</dt>
                          <dd className="min-w-0 break-words text-right">
                            {formatDate(formula.formulaCreatedAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-outline-variant pt-4">
                      <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
                        Detalle de fórmula
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-body font-medium text-primary group-hover:underline">
                        Ver detalle
                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

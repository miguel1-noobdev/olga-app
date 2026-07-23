import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
  LOT_STATUS_LABELS,
  getLotStatusStyles,
} from '@/components/laboratorio/shared-presentation';
import type { LotStatus } from '@/lib/lots/lot-types';
import { ArrowRightIcon, PlusIcon } from '@/components/ui/icons';

const LOT_STATUS_PRESENTATION: Record<
  LotStatus,
  { icon: string; iconClass: string; iconBackground: string; accentClass: string }
> = {
  in_production: {
    icon: 'autorenew',
    iconClass: 'text-secondary',
    iconBackground: 'bg-secondary/10',
    accentClass: 'border-l-secondary',
  },
  finalized: {
    icon: 'task_alt',
    iconClass: 'text-primary',
    iconBackground: 'bg-primary/10',
    accentClass: 'border-l-primary',
  },
  discarded: {
    icon: 'cancel',
    iconClass: 'text-error',
    iconBackground: 'bg-error/10',
    accentClass: 'border-l-error',
  },
};

export const dynamic = 'force-dynamic';

export default async function LaboratoryLotesPage() {
  await connectToDatabase();
  const repository = createLotRepository();
  const lots = await repository.findAll();

  return (
    <main className="flex-1 min-w-0 container mx-auto px-6 py-12 max-w-7xl">
      <div className="min-w-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="min-w-0">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_12px_rgba(150,248,255,0.25)] tracking-tight break-words">
              Producción de lotes
            </h1>
            <p className="font-body text-on-surface-variant mt-2 text-lg">
              Seguí cada lote de producción desde un solo espacio de trabajo.
            </p>
          </div>

          <Link
            href="/laboratorio/lotes/nuevo"
            className="bg-surface-container border border-secondary text-secondary hover:bg-primary-dim transition-colors duration-200 px-5 py-2.5 rounded-full font-label font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(150,248,255,0.15)] hover:shadow-[0_0_20px_rgba(150,248,255,0.3)] w-fit"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo lote
          </Link>
        </header>

        {lots.length === 0 ? (
          <section
            aria-label="Estado de lotes"
            className="bg-surface-container border border-primary/40 rounded-lg p-12 text-center shadow-[0_0_24px_rgba(150,248,255,0.12)]"
          >
            <span
              className="material-symbols-outlined text-5xl text-on-surface-variant mb-5"
              aria-hidden="true"
            >
              inventory_2
            </span>
            <h2 className="font-headline text-xl text-on-surface font-bold mb-2">
              No hay lotes registrados todavía
            </h2>
            <p className="font-body text-sm text-on-surface-variant max-w-lg mx-auto">
              Los lotes aparecerán aquí cuando se creen desde una fórmula validada.
            </p>
          </section>
        ) : (
          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label="Lista de lotes"
          >
            {lots.map((lot) => {
              const presentation = LOT_STATUS_PRESENTATION[lot.status];

              return (
                <li key={lot.id} className="min-w-0 h-full">
                  <Link
                    href={`/laboratorio/lotes/${lot.id}`}
                    aria-label={`Ver detalles de ${lot.lotCode}`}
                    className={`bg-surface-container border border-outline-variant border-l-4 rounded-lg p-6 flex h-full min-w-0 flex-col hover:no-underline group hover:border-primary/50 transition-colors ${presentation.accentClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${presentation.iconBackground}`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl ${presentation.iconClass}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                          aria-hidden="true"
                        >
                          {presentation.icon}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-label font-semibold uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
                      >
                        {LOT_STATUS_LABELS[lot.status]}
                      </span>
                    </div>

                    <div className="mt-6 flex-1 min-w-0">
                      <h2 className="font-headline text-xl text-on-surface font-bold break-words">
                        {lot.lotCode}
                      </h2>
                      <p className="mt-4 font-label text-xs uppercase tracking-wider text-on-surface-variant">
                        Fórmula de origen
                      </p>
                      <p className="mt-1 font-body text-base text-on-surface break-words">
                        {lot.formulaSnapshot.productName}
                      </p>
                      <dl className="mt-4 grid grid-cols-1 gap-2 font-body text-sm text-on-surface-variant">
                        <div className="flex min-w-0 justify-between gap-4">
                          <dt className="font-medium text-on-surface">Número de lote</dt>
                          <dd className="min-w-0 break-words text-right">{lot.lotNumber}</dd>
                        </div>
                        <div className="flex min-w-0 justify-between gap-4">
                          <dt className="font-medium text-on-surface">Lote objetivo</dt>
                          <dd className="min-w-0 break-words text-right">{lot.targetBatchGrams} g</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-outline-variant pt-4">
                      <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
                        Detalle de lote
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

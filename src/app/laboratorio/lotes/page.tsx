import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
  LOT_STATUS_LABELS,
  getLotStatusStyles,
} from '@/components/laboratorio/shared-presentation';

export default async function LaboratoryLotesPage() {
  await connectToDatabase();
  const repository = createLotRepository();
  const lots = await repository.findAll();

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl text-on-surface">Laboratorio — Lotes</h1>
          <p className="font-body text-on-surface-variant">
            Seguí cada lote de producción desde un solo espacio de trabajo.
          </p>
        </div>

        {lots.length === 0 ? (
          <section className="bg-surface-container border border-surface-border rounded-2xl p-8 text-center space-y-2">
            <h2 className="font-headline text-2xl text-on-surface">No hay lotes registrados todavía</h2>
            <p className="font-body text-sm text-on-surface-variant">
              Los lotes aparecerán aquí cuando se creen desde una fórmula validada.
            </p>
          </section>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lots.map((lot) => (
              <li key={lot.id}>
                <Link
                  href={`/laboratorio/lotes/${lot.id}`}
                  aria-label={`Ver detalles de ${lot.lotCode}`}
                  className="block bg-surface-container border border-surface-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-headline text-xl text-on-surface">{lot.lotCode}</h2>
                      <p className="font-body text-sm text-on-surface-variant">
                        {lot.formulaSnapshot.productName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-label font-medium uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
                    >
                      {LOT_STATUS_LABELS[lot.status]}
                    </span>
                  </div>
                  <p className="mt-4 font-body text-sm text-on-surface-variant">
                    Lote número {lot.lotNumber} — {lot.targetBatchGrams} g objetivo
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

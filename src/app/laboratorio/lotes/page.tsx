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
          <h1 className="font-serif text-4xl text-on-surface">Laboratory — Lotes</h1>
          <p className="font-sans text-on-surface-variant">
            Track every production lot from one canonical workspace.
          </p>
        </div>

        {lots.length === 0 ? (
          <section className="glass-card rounded-xl p-8 text-center space-y-2">
            <h2 className="font-serif text-2xl text-on-surface">No lots registered yet</h2>
            <p className="font-sans text-sm text-on-surface-variant">
              Lots will appear here once they are created from a validated formula.
            </p>
          </section>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lots.map((lot) => (
              <li key={lot.id}>
                <Link
                  href={`/laboratorio/lotes/${lot.id}`}
                  aria-label={`View details for ${lot.lotCode}`}
                  className="block glass-card rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl text-on-surface">{lot.lotCode}</h2>
                      <p className="font-sans text-sm text-on-surface-variant">
                        {lot.formulaSnapshot.productName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-sans font-medium uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
                    >
                      {LOT_STATUS_LABELS[lot.status]}
                    </span>
                  </div>
                  <p className="mt-4 font-sans text-sm text-on-surface-variant">
                    Lot number {lot.lotNumber} — {lot.targetBatchGrams} g target
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

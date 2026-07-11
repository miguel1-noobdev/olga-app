import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { LeafIcon, ArrowLeftIcon } from '@/components/ui/icons';
import {
  formatPlantList,
  formatPlantExtracts,
  hasPlantInternalNotes,
  PlantCountSummary,
} from '@/components/laboratorio/shared-presentation';

export default async function LaboratoryPlantsPage() {
  await connectToDatabase();
  const repo = createPlantRepository();
  const plants = await repo.findAll();

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 space-y-4">
          <Link
            href="/laboratorio"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to laboratory
          </Link>

          <div>
            <h1 className="font-serif text-4xl text-on-surface mb-2">
              Laboratory — Plants
            </h1>
            <p className="font-sans text-lg text-on-surface-variant">
              Internal inventory of botanical raw materials available for formulas and production.
            </p>
          </div>
        </div>

        {plants.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <LeafIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-sans text-lg text-on-surface font-medium mb-1">
              No plants registered yet
            </p>
            <p className="font-sans text-sm text-on-surface-variant max-w-md mx-auto">
              Your laboratory plant inventory is empty. Plants must be added by an administrator before they can be used in formulas and lots.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border bg-surface-container/50">
              <PlantCountSummary count={plants.length} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[52rem]">
                <thead className="bg-surface-container border-b border-surface-border">
                  <tr>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Common name
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Scientific name
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Family
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Used parts
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Extracts
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Internal notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {plants.map((plant) => (
                    <tr
                      key={plant.id}
                      className="hover:bg-surface-container/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-sans text-sm font-medium text-on-surface">
                        {plant.commonName}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant italic">
                        {plant.scientificName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-sans text-xs">
                          {plant.family}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant">
                        {formatPlantList(plant.usedParts)}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant">
                        {formatPlantExtracts(plant.availableExtracts)}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant">
                        {hasPlantInternalNotes(plant) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/15 text-on-surface font-sans text-xs">
                            Has notes
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

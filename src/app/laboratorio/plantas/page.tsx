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
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al laboratorio
          </Link>

          <div>
            <h1 className="font-headline text-4xl text-on-surface mb-2">
              Laboratorio — Plantas
            </h1>
            <p className="font-body text-lg text-on-surface-variant">
              Inventario interno de materias primas botánicas disponibles para fórmulas y producción.
            </p>
          </div>
        </div>

        {plants.length === 0 ? (
          <div className="bg-surface-container border border-surface-border rounded-2xl p-12 text-center">
            <LeafIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-body text-lg text-on-surface font-medium mb-1">
              No hay plantas registradas todavía
            </p>
            <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto">
              Tu inventario de plantas del laboratorio está vacío. Las plantas deben ser agregadas por una administradora antes de poder usarse en fórmulas y lotes.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container border border-surface-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border bg-surface-container-high/50">
              <PlantCountSummary count={plants.length} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[52rem]">
                <thead className="bg-surface-container-high border-b border-surface-border">
                  <tr>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Nombre común
                    </th>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Nombre científico
                    </th>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Familia
                    </th>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Partes usadas
                    </th>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Extractos
                    </th>
                    <th className="px-6 py-4 font-body text-sm font-semibold text-on-surface">
                      Notas internas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {plants.map((plant) => (
                    <tr
                      key={plant.id}
                      className="hover:bg-surface-container/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-body text-sm font-medium text-on-surface">
                        {plant.commonName}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-on-surface-variant italic">
                        {plant.scientificName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-body text-xs border border-surface-border">
                          {plant.family}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                        {formatPlantList(plant.usedParts)}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                        {formatPlantExtracts(plant.availableExtracts)}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                        {hasPlantInternalNotes(plant) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/15 text-on-surface font-body text-xs border border-secondary/20">
                            Con notas
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

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { LeafIcon } from '@/components/ui/icons';
import {
  formatPlantList,
  formatPlantExtracts,
  hasPlantInternalNotes,
} from '@/components/laboratorio/shared-presentation';

export const dynamic = 'force-dynamic';

export default async function LaboratoryPlantsPage() {
  await connectToDatabase();
  const plants = await createPlantRepository().findAll();
  const countLabel = plants.length === 1 ? 'PLANTA REGISTRADA' : 'PLANTAS REGISTRADAS';

  return (
    <main className="flex flex-1 flex-col p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
        <header
          aria-label="Resumen del catálogo botánico"
          className="mb-8 flex flex-col justify-between gap-4 border-l-2 border-primary pl-4 md:flex-row md:items-end"
        >
          <div>
            <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-tertiary lg:text-5xl">
              Mi jardín
            </h1>
            <p className="max-w-2xl font-body text-base text-on-surface-variant">
              Catálogo botánico interno de referencia operativa.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded border border-outline-variant/30 bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-sm text-primary">local_florist</span>
            <span className="font-label text-sm font-bold tracking-wider text-primary">
              {plants.length} {countLabel}
            </span>
          </div>
        </header>

        <section className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-low shadow-lg">
          <div
            data-testid="plant-table-accent"
            className="h-1 w-full bg-gradient-to-r from-primary via-tertiary to-secondary-fixed"
          />
          {plants.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <LeafIcon className="mb-4 h-12 w-12 text-primary" />
              <p className="mb-1 font-body text-lg font-medium text-on-surface">
                No hay plantas registradas todavía
              </p>
              <p className="max-w-md font-body text-sm text-on-surface-variant">
                Cuando incorpores una planta al dominio botánico, aparecerá en este catálogo de consulta.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-[52rem] w-full text-left">
                <thead className="sticky top-0 z-10 bg-surface-container font-label text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="min-w-[180px] px-6 py-4 font-semibold">Nombre común</th>
                    <th className="min-w-[220px] px-6 py-4 font-semibold">Nombre científico</th>
                    <th className="min-w-[150px] px-6 py-4 font-semibold">Family</th>
                    <th className="min-w-[180px] px-6 py-4 font-semibold">Partes usadas</th>
                    <th className="min-w-[300px] px-6 py-4 font-semibold">Extractos</th>
                    <th className="w-24 px-6 py-4 text-center font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant text-on-surface">
                  {plants.map((plant) => (
                    <tr key={plant.id} className="transition-colors duration-150 hover:bg-surface-container">
                      <td className="px-6 py-3 font-body text-sm font-medium text-primary">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-primary-dim">
                          {plant.commonName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-body text-sm font-light italic text-on-surface-variant">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-primary">
                          {plant.scientificName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-label text-xs uppercase tracking-wide text-secondary">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-secondary-fixed">
                          {plant.family}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-body text-sm text-on-surface-variant">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-primary">
                          {formatPlantList(plant.usedParts)}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-body text-sm text-on-surface">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-primary">
                          {formatPlantExtracts(plant.availableExtracts)}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-center font-body text-sm text-outline">
                        <Link href={`/laboratorio/plantas/${plant.slug}`} aria-label={`Ver ficha interna de ${plant.commonName}`} className="block hover:text-primary">
                          {hasPlantInternalNotes(plant) ? 'Sí' : '—'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="flex items-center justify-between border-t border-outline-variant/30 bg-surface-container-low p-3 font-label text-xs tracking-wide text-on-surface-variant">
            <span>Orden alfabético (A-Z)</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">database</span>
              Datos de sólo lectura
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { FlaskIcon } from '@/components/ui/icons';
import {
  OilPhaseBadge,
  formatRecommendedPercentage,
  ObservationsPreview,
} from '@/components/laboratorio/shared-presentation';

export const dynamic = 'force-dynamic';

export default async function LaboratoryOilsPage() {
  await connectToDatabase();
  const repo = createOilRepository();
  const oils = await repo.findAll();

  return (
    <main className="flex-1 bg-surface px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-10 border-l-4 border-primary-fixed pl-4">
          <h1 className="mb-2 font-headline text-3xl font-bold tracking-tight text-on-background md:text-4xl">Mis aceites</h1>
          <p className="font-label text-sm text-on-surface-variant">Inventario técnico de aceites vegetales y grasas del laboratorio.</p>
        </header>

        {oils.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container p-12 text-center">
            <FlaskIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-body text-lg text-on-surface font-medium mb-1">
              No hay aceites registrados todavía
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              Tus aceites del laboratorio aparecerán aquí una vez creados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[70rem] whitespace-nowrap text-left text-sm">
                <thead className="border-b border-outline-variant bg-surface-container-high font-label text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    {['Nombre', 'HLB', 'Solubilidad', 'Tipo de piel', 'Absorción', 'Propiedades', 'Porcentaje recomendado', 'Fase', 'Observaciones'].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-medium">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface text-on-background">
                  {oils.map((oil) => (
                    <tr key={oil.id} className="transition-colors hover:bg-surface-bright">
                      <td className="px-4 py-4 font-medium text-primary-dim hover:text-primary"><Link href={`/laboratorio/aceites/${oil.slug}`}>{oil.name}</Link></td>
                      <td className="px-4 py-4 font-mono text-tertiary">{oil.hlb ?? '—'}</td>
                      <td className="px-4 py-4">{oil.solubility ?? '—'}</td>
                      <td className="px-4 py-4 text-secondary-fixed">{oil.skinTypes.length > 0 ? oil.skinTypes.join(', ') : '—'}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{oil.absorption ?? '—'}</td>
                      <td className="px-4 py-4">{oil.properties.length > 0 ? oil.properties.join(', ') : '—'}</td>
                      <td className="px-4 py-4 text-center text-on-surface-variant">{formatRecommendedPercentage(oil.recommendedPercentage)}</td>
                      <td className="px-4 py-4"><OilPhaseBadge phase={oil.phase} /></td>
                      <td className="max-w-[200px] px-4 py-4 text-xs text-on-surface-variant">
                        <ObservationsPreview observations={oil.observations} />
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

import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { FlaskIcon, ArrowLeftIcon } from '@/components/ui/icons';
import {
  OilPhaseBadge,
  formatRecommendedPercentage,
  ObservationsPreview,
  OilCountSummary,
} from '@/components/laboratorio/shared-presentation';

export default async function LaboratoryOilsPage() {
  await connectToDatabase();
  const repo = createOilRepository();
  const oils = await repo.findAll();

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
              Laboratory — Oils
            </h1>
            <p className="font-sans text-lg text-on-surface-variant">
              Available oils for formulas
            </p>
          </div>
        </div>

        {oils.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <FlaskIcon className="w-12 h-12 mx-auto mb-4 text-on-surface-variant" />
            <p className="font-sans text-lg text-on-surface font-medium mb-1">
              No oils registered yet
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              Your laboratory oils will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border bg-surface-container/50">
              <OilCountSummary count={oils.length} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[44rem]">
                <thead className="bg-surface-container border-b border-surface-border">
                  <tr>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Name
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      INCI
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface text-right">
                      HLB
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Phase
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface text-right">
                      Recommended %
                    </th>
                    <th className="px-6 py-4 font-sans text-sm font-semibold text-on-surface">
                      Observations
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {oils.map((oil) => (
                    <tr key={oil.id}>
                      <td className="px-6 py-4 font-sans text-sm font-medium text-on-surface">
                        {oil.name}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant">
                        {oil.inciName ?? '—'}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant text-right">
                        {oil.hlb ?? '—'}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant">
                        <OilPhaseBadge phase={oil.phase} />
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant text-right">
                        {formatRecommendedPercentage(oil.recommendedPercentage)}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-on-surface-variant max-w-xs">
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

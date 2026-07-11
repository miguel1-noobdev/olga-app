import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { FormulaRecord } from '@/lib/formulas/formula-types';
import { LotRecord } from '@/lib/lots/lot-types';
import { ArrowLeftIcon, PlusIcon } from '@/components/ui/icons';
import {
  formatDate,
  SectionCard,
  EmptySectionMessage,
  PhasesSection,
  ProcedureSection,
  FORMULA_STATUS_LABELS,
  getFormulaStatusStyles,
  LOT_STATUS_LABELS,
  getLotStatusStyles,
} from '@/components/laboratorio/shared-presentation';

interface PageProps {
  params: { id: string };
}

function IdentitySection({ formula }: { formula: FormulaRecord }) {
  return (
    <section className="glass-card rounded-xl p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-on-surface mb-2">{formula.productName}</h1>
          <p className="font-sans text-sm text-on-surface-variant">
            {formula.formulaCode} — v{formula.formulaVersion} — {formula.productType}
          </p>
        </div>
        <span
          className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}
        >
          {FORMULA_STATUS_LABELS[formula.status]}
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-sm">
        <div>
          <dt className="font-semibold text-on-surface">Target batch</dt>
          <dd className="text-on-surface-variant">{formula.targetBatchGrams} g</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Created on</dt>
          <dd className="text-on-surface-variant">{formatDate(formula.formulaCreatedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

function LotsSection({ formulaId, lots }: { formulaId: string; lots: LotRecord[] }) {
  return (
    <SectionCard title="Lots">
      {lots.length === 0 ? (
        <EmptySectionMessage>No lots registered for this formula.</EmptySectionMessage>
      ) : (
        <ul className="space-y-4">
          {lots.map((lot) => (
            <li
              key={lot.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-surface-container"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/laboratorio/formulas/${formulaId}/lotes/${lot.id}`}
                    className="font-sans text-sm font-semibold text-on-surface hover:text-primary transition-colors"
                  >
                    {lot.lotCode}
                  </Link>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-sans font-medium uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
                  >
                    {LOT_STATUS_LABELS[lot.status]}
                  </span>
                </div>
                <p className="font-sans text-xs text-on-surface-variant">
                  Lot number {lot.lotNumber} — {lot.targetBatchGrams} g target
                </p>
                {(lot.plannedAt || lot.startedAt || lot.completedAt) && (
                  <p className="font-sans text-xs text-on-surface-variant">
                    {[
                      lot.plannedAt && `Planned: ${formatDate(lot.plannedAt)}`,
                      lot.startedAt && `Started: ${formatDate(lot.startedAt)}`,
                      lot.completedAt && `Completed: ${formatDate(lot.completedAt)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ObjectivesSection({ objectives }: { objectives: string[] }) {
  return (
    <SectionCard title="Objectives">
      {objectives.length === 0 ? (
        <EmptySectionMessage>No objectives registered.</EmptySectionMessage>
      ) : (
        <ul className="list-disc list-inside font-sans text-sm text-on-surface-variant space-y-1">
          {objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function TechnicalDataSection({ data }: { data?: FormulaRecord['technicalData'] }) {
  const fields = [
    { label: 'Final pH', value: data?.finalPh },
    { label: 'Production temperature', value: data?.productionTemperatureCelsius, suffix: '°C' },
    { label: 'Mixing time', value: data?.mixingTimeMinutes, suffix: ' min' },
    { label: 'Preservative', value: data?.preservative },
    { label: 'Fragrance', value: data?.fragrance },
    { label: 'Color', value: data?.color },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== null);

  return (
    <SectionCard title="Technical data">
      {!hasAnyValue ? (
        <EmptySectionMessage>No technical data registered.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
          {fields.map(({ label, value, suffix }) =>
            value !== undefined && value !== null ? (
              <div key={label}>
                <dt className="font-semibold text-on-surface">{label}</dt>
                <dd className="text-on-surface-variant">
                  {value}
                  {suffix ?? ''}
                </dd>
              </div>
            ) : null
          )}
        </dl>
      )}
    </SectionCard>
  );
}

function ProductEvaluationSection({
  evaluation,
}: {
  evaluation?: FormulaRecord['productEvaluation'];
}) {
  const fields = [
    { label: 'Texture', value: evaluation?.texture },
    { label: 'Color', value: evaluation?.color },
    { label: 'Smell', value: evaluation?.smell },
    { label: 'Viscosity', value: evaluation?.viscosity },
    { label: 'Absorption', value: evaluation?.absorption },
    { label: 'Foam', value: evaluation?.foam },
    { label: 'Stability', value: evaluation?.stability },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== '');

  return (
    <SectionCard title="Product evaluation">
      {!hasAnyValue ? (
        <EmptySectionMessage>No product evaluation registered.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
          {fields.map(({ label, value }) =>
            value !== undefined && value !== '' ? (
              <div key={label}>
                <dt className="font-semibold text-on-surface">{label}</dt>
                <dd className="text-on-surface-variant">{value}</dd>
              </div>
            ) : null
          )}
        </dl>
      )}
    </SectionCard>
  );
}

function UseTestSection({ useTest }: { useTest?: FormulaRecord['useTest'] }) {
  const hasEntries = (useTest?.entries ?? []).length > 0;
  const hasExpiration = Boolean(useTest?.approxExpirationDate);

  return (
    <SectionCard title="Use test">
      {!hasEntries && !hasExpiration ? (
        <EmptySectionMessage>No use test data registered.</EmptySectionMessage>
      ) : (
        <div className="space-y-4">
          {hasExpiration && (
            <div>
              <h3 className="font-sans text-sm font-semibold text-on-surface mb-1">
                Approximate expiration
              </h3>
              <p className="font-sans text-sm text-on-surface-variant">
                {formatDate(useTest?.approxExpirationDate ?? undefined)}
              </p>
            </div>
          )}
          {hasEntries && (
            <div>
              <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">Entries</h3>
              <ul className="space-y-3">
                {useTest?.entries.map((entry) => (
                  <li key={`${entry.date}-${entry.note}`} className="font-sans text-sm">
                    <span className="block text-on-surface-variant mb-0.5">
                      {formatDate(entry.date)}
                    </span>
                    <p className="text-on-surface">{entry.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function InciSection({ inci }: { inci?: FormulaRecord['inci'] }) {
  const fields = [
    { label: 'Function', value: inci?.function },
    { label: 'Emulsion type', value: inci?.emulsionType },
    { label: 'Dosage', value: inci?.dosage },
    { label: 'Temperature', value: inci?.temperature },
    { label: 'Compatibility', value: inci?.compatibility },
    { label: 'Inconveniences', value: inci?.inconveniences },
    { label: 'pH', value: inci?.ph },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== '');

  return (
    <SectionCard title="INCI">
      {!hasAnyValue ? (
        <EmptySectionMessage>No INCI data registered.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
          {fields.map(({ label, value }) =>
            value !== undefined && value !== '' ? (
              <div key={label}>
                <dt className="font-semibold text-on-surface">{label}</dt>
                <dd className="text-on-surface-variant">{value}</dd>
              </div>
            ) : null
          )}
        </dl>
      )}
    </SectionCard>
  );
}

function FinalObservationsSection({ observations }: { observations?: string }) {
  return (
    <SectionCard title="Final observations">
      {!observations || observations.trim() === '' ? (
        <EmptySectionMessage>No final observations registered.</EmptySectionMessage>
      ) : (
        <p className="font-sans text-sm text-on-surface-variant whitespace-pre-wrap">
          {observations}
        </p>
      )}
    </SectionCard>
  );
}

export default async function LaboratoryFormulaDetailPage({ params }: PageProps) {
  await connectToDatabase();
  const formulaRepo = createFormulaRepository();
  const lotRepo = createLotRepository();
  const formula = await formulaRepo.findById(params.id);

  if (!formula) {
    notFound();
  }

  const lots = await lotRepo.findByFormulaId(params.id);

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/laboratorio/formulas"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to formulas
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href={`/laboratorio/formulas/${formula.id}/edit`}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-sm font-medium"
            >
              Edit formula
            </Link>

            {formula.status === 'validated' && (
              <Link
                href={`/laboratorio/formulas/${formula.id}/lotes/nuevo`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Create lot
              </Link>
            )}
          </div>
        </div>

        <IdentitySection formula={formula} />
        <LotsSection formulaId={formula.id} lots={lots} />
        <ObjectivesSection objectives={formula.productObjectives} />
        <PhasesSection phases={formula.phases} />
        <ProcedureSection steps={formula.procedureSteps} />
        <TechnicalDataSection data={formula.technicalData} />
        <ProductEvaluationSection evaluation={formula.productEvaluation} />
        <UseTestSection useTest={formula.useTest} />
        <InciSection inci={formula.inci} />
        <FinalObservationsSection observations={formula.finalObservations} />
      </div>
    </main>
  );
}

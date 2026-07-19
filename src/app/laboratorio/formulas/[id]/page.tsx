import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { FormulaIngredient, FormulaRecord } from '@/lib/formulas/formula-types';
import { LotRecord } from '@/lib/lots/lot-types';
import {
  formatDate,
  EmptySectionMessage,
  FORMULA_STATUS_LABELS,
  getFormulaStatusStyles,
  LOT_STATUS_LABELS,
  getLotStatusStyles,
} from '@/components/laboratorio/shared-presentation';

interface PageProps {
  params: { id: string };
}

const FORMULA_STATUS_ACCENTS: Record<FormulaRecord['status'], string> = {
  draft: 'bg-on-surface-variant',
  testing: 'bg-secondary',
  validated: 'bg-primary',
  archived: 'bg-on-surface-variant',
  discarded: 'bg-error',
};

function MaterialIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

function FormulaSectionCard({
  title,
  icon,
  accent = 'text-primary',
  children,
}: {
  title: string;
  icon: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container shadow-lg shadow-primary/5">
      <div className="flex items-center gap-3 border-b border-outline-variant px-5 py-4">
        <MaterialIcon name={icon} className={`text-[20px] ${accent}`} />
        <h2 className={`font-headline text-lg font-bold tracking-tight ${accent}`}>{title}</h2>
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function ValueTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
      <dt className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </dt>
      <dd className="mt-1 break-words font-body text-sm text-on-surface">{value}</dd>
    </div>
  );
}

function PhaseCard({
  title,
  ingredients,
}: {
  title: string;
  ingredients?: FormulaIngredient[];
}) {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <article className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(255,178,4,0.7)]" />
        <h3 className="font-label text-xs font-bold uppercase tracking-wider text-secondary">{title}</h3>
      </div>
      <ul className="divide-y divide-outline-variant">
        {ingredients.map((item) => (
          <li
            key={`${item.ingredient}-${item.grams}`}
            className="flex min-w-0 justify-between gap-3 border-b border-outline-variant py-2 last:border-b-0 font-body text-sm"
          >
            <span className="min-w-0 break-words text-on-surface-variant">{item.ingredient}</span>
            <span className="shrink-0 font-medium text-on-surface">{item.grams} g</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function IdentitySection({ formula }: { formula: FormulaRecord }) {
  return (
    <div className="border-b border-outline-variant pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words font-headline text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_12px_rgba(150,248,255,0.25)]">
              {formula.productName}
            </h1>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-label font-semibold uppercase tracking-wider ${getFormulaStatusStyles(formula.status)}`}
            >
              <span
                aria-label={`Estado ${FORMULA_STATUS_LABELS[formula.status].toLowerCase()}`}
                className={`h-2 w-2 rounded-full ${FORMULA_STATUS_ACCENTS[formula.status]}`}
              />
              {FORMULA_STATUS_LABELS[formula.status]}
            </span>
          </div>
          <span className="sr-only">
            {formula.formulaCode} — v{formula.formulaVersion} — {formula.productType}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 font-body text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <MaterialIcon name="tag" className="text-[17px] text-primary" />
          {formula.formulaCode}
        </span>
        <span className="inline-flex items-center gap-2">
          <MaterialIcon name="history" className="text-[17px] text-primary" />
          v{formula.formulaVersion}
        </span>
        <span className="inline-flex items-center gap-2">
          <MaterialIcon name="category" className="text-[17px] text-primary" />
          {formula.productType}
        </span>
        <span className="inline-flex items-center gap-2">
          <MaterialIcon name="calendar_today" className="text-[17px] text-primary" />
          {formatDate(formula.formulaCreatedAt)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MaterialIcon name="scale" className="text-[17px] text-primary" />
          {formula.targetBatchGrams} g
        </span>
      </div>
    </div>
  );
}

function LotsSection({ lots }: { lots: LotRecord[] }) {
  return (
    <FormulaSectionCard title="Lotes" icon="inventory_2">
      {lots.length === 0 ? (
        <EmptySectionMessage>No hay lotes registrados para esta fórmula.</EmptySectionMessage>
      ) : (
        <ul className="space-y-3">
          {lots.map((lot) => (
            <li
              key={lot.id}
              className="flex min-w-0 flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/laboratorio/lotes/${lot.id}`}
                    className="font-body text-sm font-semibold text-on-surface hover:text-primary transition-colors"
                  >
                    {lot.lotCode}
                  </Link>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-label font-medium uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {LOT_STATUS_LABELS[lot.status]}
                  </span>
                </div>
                <p className="font-body text-xs text-on-surface-variant">
                  Lote n.º {lot.lotNumber} — {lot.targetBatchGrams} g de objetivo
                </p>
                {(lot.plannedAt || lot.startedAt || lot.completedAt) && (
                  <p className="font-body text-xs text-on-surface-variant">
                    {[
                      lot.plannedAt && `Planificado: ${formatDate(lot.plannedAt)}`,
                      lot.startedAt && `Iniciado: ${formatDate(lot.startedAt)}`,
                      lot.completedAt && `Completado: ${formatDate(lot.completedAt)}`,
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
    </FormulaSectionCard>
  );
}

function ObjectivesSection({ objectives }: { objectives: string[] }) {
  return (
    <FormulaSectionCard title="Objetivos" icon="target">
      {objectives.length === 0 ? (
        <EmptySectionMessage>No hay objetivos registrados.</EmptySectionMessage>
      ) : (
        <ul className="space-y-2 font-body text-sm text-on-surface-variant">
          {objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      )}
    </FormulaSectionCard>
  );
}

function TechnicalDataSection({ data }: { data?: FormulaRecord['technicalData'] }) {
  const fields = [
    { label: 'pH final', value: data?.finalPh },
    { label: 'Temperatura de producción', value: data?.productionTemperatureCelsius, suffix: '°C' },
    { label: 'Tiempo de mezcla', value: data?.mixingTimeMinutes, suffix: ' min' },
    { label: 'Conservante', value: data?.preservative },
    { label: 'Fragancia', value: data?.fragrance },
    { label: 'Color', value: data?.color },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== null);

  return (
    <FormulaSectionCard title="Datos técnicos" icon="settings" accent="text-secondary">
      {!hasAnyValue ? (
        <EmptySectionMessage>No hay datos técnicos registrados.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
          {fields.map(({ label, value, suffix }) =>
            value !== undefined && value !== null ? (
              <ValueTile key={label} label={label} value={`${value}${suffix ?? ''}`} />
            ) : null
          )}
        </dl>
      )}
    </FormulaSectionCard>
  );
}

function ProductEvaluationSection({
  evaluation,
}: {
  evaluation?: FormulaRecord['productEvaluation'];
}) {
  const fields = [
    { label: 'Textura', value: evaluation?.texture },
    { label: 'Color', value: evaluation?.color },
    { label: 'Olor', value: evaluation?.smell },
    { label: 'Viscosidad', value: evaluation?.viscosity },
    { label: 'Absorción', value: evaluation?.absorption },
    { label: 'Espuma', value: evaluation?.foam },
    { label: 'Estabilidad', value: evaluation?.stability },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== '');

  return (
    <FormulaSectionCard title="Evaluación del producto" icon="fact_check" accent="text-tertiary">
      {!hasAnyValue ? (
        <EmptySectionMessage>No hay evaluación del producto registrada.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
          {fields.map(({ label, value }) =>
            value !== undefined && value !== '' ? (
              <ValueTile key={label} label={label} value={value} />
            ) : null
          )}
        </dl>
      )}
    </FormulaSectionCard>
  );
}

function UseTestSection({ useTest }: { useTest?: FormulaRecord['useTest'] }) {
  const hasEntries = (useTest?.entries ?? []).length > 0;
  const hasExpiration = Boolean(useTest?.approxExpirationDate);

  return (
    <FormulaSectionCard title="Prueba de uso" icon="event_note">
      {!hasEntries && !hasExpiration ? (
        <EmptySectionMessage>No hay datos de prueba de uso registrados.</EmptySectionMessage>
      ) : (
        <div className="space-y-4">
          {hasExpiration && (
            <dl>
              <ValueTile
                label="Vencimiento aproximado"
                value={formatDate(useTest?.approxExpirationDate ?? undefined)}
              />
            </dl>
          )}
          {hasEntries && (
            <div>
              <h3 className="font-body text-sm font-semibold text-on-surface mb-2">Entradas</h3>
              <ul className="space-y-3">
                {useTest?.entries.map((entry) => (
                  <li
                    key={`${entry.date}-${entry.note}`}
                    className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 font-body text-sm"
                  >
                    <span className="block text-xs text-on-surface-variant mb-1">
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
    </FormulaSectionCard>
  );
}

function InciSection({ inci }: { inci?: FormulaRecord['inci'] }) {
  const fields = [
    { label: 'Función', value: inci?.function },
    { label: 'Tipo de emulsión', value: inci?.emulsionType },
    { label: 'Dosificación', value: inci?.dosage },
    { label: 'Temperatura', value: inci?.temperature },
    { label: 'Compatibilidad', value: inci?.compatibility },
    { label: 'Inconvenientes', value: inci?.inconveniences },
    { label: 'pH', value: inci?.ph },
  ];

  const hasAnyValue = fields.some((field) => field.value !== undefined && field.value !== '');

  return (
    <FormulaSectionCard title="INCI" icon="menu_book" accent="text-tertiary">
      {!hasAnyValue ? (
        <EmptySectionMessage>No hay datos INCI registrados.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
          {fields.map(({ label, value }) =>
            value !== undefined && value !== '' ? (
              <ValueTile key={label} label={label} value={value} />
            ) : null
          )}
        </dl>
      )}
    </FormulaSectionCard>
  );
}

function FinalObservationsSection({ observations }: { observations?: string }) {
  return (
    <FormulaSectionCard title="Observaciones finales" icon="notes" accent="text-tertiary">
      {!observations || observations.trim() === '' ? (
        <EmptySectionMessage>No hay observaciones finales registradas.</EmptySectionMessage>
      ) : (
        <p className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 font-body text-sm text-on-surface-variant whitespace-pre-wrap">
          {observations}
        </p>
      )}
    </FormulaSectionCard>
  );
}

function PhasesSection({ phases }: { phases?: FormulaRecord['phases'] }) {
  const phaseCards = [
    { title: 'Fase acuosa', ingredients: phases?.aqueous },
    { title: 'Fase oleosa', ingredients: phases?.oil },
    { title: 'Activos', ingredients: phases?.actives },
  ];

  return (
    <FormulaSectionCard title="Fases e ingredientes" icon="science" accent="text-secondary">
      {phaseCards.some(({ ingredients }) => ingredients && ingredients.length > 0) ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {phaseCards.map((phase) => (
            <PhaseCard key={phase.title} {...phase} />
          ))}
        </div>
      ) : (
        <EmptySectionMessage>No hay fases registradas.</EmptySectionMessage>
      )}
    </FormulaSectionCard>
  );
}

function ProcedureSection({ steps }: { steps: FormulaRecord['procedureSteps'] }) {
  return (
    <FormulaSectionCard title="Procedimiento" icon="account_tree" accent="text-tertiary">
      {steps.length === 0 ? (
        <EmptySectionMessage>No hay pasos de procedimiento registrados.</EmptySectionMessage>
      ) : (
        <ol className="space-y-3">
          {steps.map((step) => (
            <li
              key={step.stepNumber}
              className="flex min-w-0 gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 font-label text-xs font-bold text-primary">
                {step.stepNumber}
              </span>
              <p className="min-w-0 break-words pt-1 font-body text-sm text-on-surface-variant">
                {step.instruction}
              </p>
            </li>
          ))}
        </ol>
      )}
    </FormulaSectionCard>
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
    <main className="min-h-screen overflow-x-hidden bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-5" role="banner">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/laboratorio/formulas"
              className="inline-flex items-center gap-2 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
            >
              <MaterialIcon name="arrow_back" className="text-[18px]" />
              Volver a fórmulas
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/laboratorio/formulas/${formula.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-2 font-label text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container"
              >
                <MaterialIcon name="edit" className="text-[17px]" />
                Editar fórmula
              </Link>

              {formula.status === 'validated' && (
                <Link
                  href={`/laboratorio/lotes/nuevo?formulaId=${formula.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label text-xs font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary/90"
                >
                  <MaterialIcon name="add" className="text-[18px]" />
                  Crear lote
                </Link>
              )}
            </div>
          </div>

          <IdentitySection formula={formula} />
        </header>

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-12">
          <div className="min-w-0 space-y-6 md:col-span-8">
            <PhasesSection phases={formula.phases} />
            <ProcedureSection steps={formula.procedureSteps} />
            <ProductEvaluationSection evaluation={formula.productEvaluation} />
            <UseTestSection useTest={formula.useTest} />
            <InciSection inci={formula.inci} />
          </div>

          <div className="min-w-0 space-y-6 md:col-span-4">
            <LotsSection lots={lots} />
            <ObjectivesSection objectives={formula.productObjectives} />
            <TechnicalDataSection data={formula.technicalData} />
            <FinalObservationsSection observations={formula.finalObservations} />
          </div>
        </div>
      </div>
    </main>
  );
}

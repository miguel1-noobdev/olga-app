import {
  FormulaIngredient,
  FormulaPhase,
  FormulaProcedureStep,
  FormulaStatus,
} from '@/lib/formulas/formula-types';
import { LotStatus, FormulaTechnicalDataSnapshot } from '@/lib/lots/lot-types';
import type { PlantRecord } from '@/lib/db/repository/plant';

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return 'Not set';
  }

  return new Date(isoDate).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const FORMULA_STATUS_LABELS: Record<FormulaStatus, string> = {
  draft: 'Draft',
  testing: 'Testing',
  validated: 'Validated',
  archived: 'Archived',
  discarded: 'Discarded',
};

export function getFormulaStatusStyles(status: FormulaStatus): string {
  switch (status) {
    case 'validated':
      return 'bg-primary/15 text-primary';
    case 'testing':
      return 'bg-secondary/20 text-on-surface';
    case 'draft':
      return 'bg-surface-container text-on-surface-variant';
    case 'archived':
      return 'bg-surface-border text-on-surface-variant';
    case 'discarded':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function getLotStatusStyles(status: LotStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-primary/15 text-primary';
    case 'in_progress':
      return 'bg-secondary/20 text-on-surface';
    case 'planned':
      return 'bg-surface-container text-on-surface-variant';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

export const OIL_PHASE_LABELS: Record<string, string> = {
  oil: 'Oil',
  aqueous: 'Aqueous',
  active: 'Active',
  emulsifier: 'Emulsifier',
  preservative: 'Preservative',
  other: 'Other',
};

export function getOilPhaseStyles(phase: string): string {
  switch (phase.toLowerCase()) {
    case 'oil':
      return 'bg-secondary/20 text-on-surface';
    case 'aqueous':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-primary/15 text-primary';
    case 'emulsifier':
      return 'bg-surface-container text-on-surface-variant';
    case 'preservative':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

export function formatOilPhase(phase?: string): string {
  if (!phase) {
    return '—';
  }

  return OIL_PHASE_LABELS[phase.toLowerCase()] ?? phase;
}

export function OilPhaseBadge({ phase }: { phase?: string }) {
  if (!phase) {
    return <span className="text-on-surface-variant">—</span>;
  }

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold uppercase tracking-wider ${getOilPhaseStyles(phase)}`}
    >
      {formatOilPhase(phase)}
    </span>
  );
}

export function formatRecommendedPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value}%`;
}

export function ObservationsPreview({ observations }: { observations?: string }) {
  if (!observations || observations.trim().length === 0) {
    return <span className="text-on-surface-variant/60">—</span>;
  }

  const maxLength = 60;
  const text = observations.trim();
  const truncated = text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

  return <span title={text}>{truncated}</span>;
}

export function OilCountSummary({ count }: { count: number }) {
  const label = count === 1 ? 'oil registered' : 'oils registered';

  return (
    <p className="font-sans text-sm text-on-surface-variant">
      {count} {label}
    </p>
  );
}

export function formatPlantList(values: string[]): string {
  if (values.length === 0) {
    return '—';
  }

  return values.join(', ');
}

export function formatPlantExtracts(
  extracts: Array<{ type: string; method?: string; description?: string }>
): string {
  if (extracts.length === 0) {
    return '—';
  }

  return extracts.map((extract) => extract.type).join(', ');
}

export function hasPlantInternalNotes(plant: PlantRecord): boolean {
  if (!plant.internal) {
    return false;
  }

  return Object.values(plant.internal).some(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}

export function PlantCountSummary({ count }: { count: number }) {
  const label = count === 1 ? 'plant registered' : 'plants registered';

  return (
    <p className="font-sans text-sm text-on-surface-variant">
      {count} {label}
    </p>
  );
}

export function hasPhases(phases?: FormulaPhase): boolean {
  if (!phases) {
    return false;
  }

  return Boolean(
    (phases.aqueous && phases.aqueous.length > 0) ||
      (phases.oil && phases.oil.length > 0) ||
      (phases.actives && phases.actives.length > 0)
  );
}

export function PhaseIngredientList({
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
    <div className="mb-4 last:mb-0">
      <h3 className="font-sans text-sm font-semibold text-on-surface mb-2">{title}</h3>
      <ul className="divide-y divide-surface-border">
        {ingredients.map((item) => (
          <li
            key={`${item.ingredient}-${item.grams}`}
            className="flex justify-between py-2 font-sans text-sm text-on-surface-variant"
          >
            <span>{item.ingredient}</span>
            <span className="font-medium text-on-surface">{item.grams} g</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-xl p-6">
      <h2 className="font-serif text-xl text-on-surface mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function EmptySectionMessage({ children }: { children: React.ReactNode }) {
  return <p className="font-sans text-sm text-on-surface-variant italic">{children}</p>;
}

export function PhasesSection({ phases }: { phases?: FormulaPhase }) {
  return (
    <SectionCard title="Phases and ingredients">
      {!hasPhases(phases) ? (
        <EmptySectionMessage>No phases registered.</EmptySectionMessage>
      ) : (
        <>
          <PhaseIngredientList title="Aqueous phase" ingredients={phases?.aqueous} />
          <PhaseIngredientList title="Oil phase" ingredients={phases?.oil} />
          <PhaseIngredientList title="Actives" ingredients={phases?.actives} />
        </>
      )}
    </SectionCard>
  );
}

export function ProcedureSection({ steps }: { steps: FormulaProcedureStep[] }) {
  return (
    <SectionCard title="Procedure">
      {steps.length === 0 ? (
        <EmptySectionMessage>No procedure steps registered.</EmptySectionMessage>
      ) : (
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.stepNumber} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-sans text-sm font-semibold text-on-surface">
                {step.stepNumber}
              </span>
              <p className="font-sans text-sm text-on-surface-variant pt-1.5">
                {step.instruction}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

function hasTechnicalData(data?: FormulaTechnicalDataSnapshot): boolean {
  if (!data) {
    return false;
  }

  return (
    data.productionTemperatureCelsius !== undefined ||
    data.mixingTimeMinutes !== undefined ||
    data.preservative !== undefined
  );
}

export function ProductionInstructionsSection({
  technicalData,
}: {
  technicalData?: FormulaTechnicalDataSnapshot;
}) {
  return (
    <SectionCard title="Production instructions">
      {!hasTechnicalData(technicalData) ? (
        <EmptySectionMessage>No production instructions registered.</EmptySectionMessage>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans text-sm">
          {technicalData?.productionTemperatureCelsius !== undefined && (
            <div>
              <dt className="font-semibold text-on-surface">Production temperature</dt>
              <dd className="text-on-surface-variant">
                {technicalData.productionTemperatureCelsius} °C
              </dd>
            </div>
          )}
          {technicalData?.mixingTimeMinutes !== undefined && (
            <div>
              <dt className="font-semibold text-on-surface">Mixing time</dt>
              <dd className="text-on-surface-variant">
                {technicalData.mixingTimeMinutes} min
              </dd>
            </div>
          )}
          {technicalData?.preservative !== undefined && (
            <div>
              <dt className="font-semibold text-on-surface">Preservative</dt>
              <dd className="text-on-surface-variant">{technicalData.preservative}</dd>
            </div>
          )}
        </dl>
      )}
    </SectionCard>
  );
}

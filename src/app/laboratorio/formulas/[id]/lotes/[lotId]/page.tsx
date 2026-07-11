import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository, LotRecord } from '@/lib/db/repository/lot';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { submitLotFollowUp } from './actions';
import {
  formatDate,
  SectionCard,
  EmptySectionMessage,
  PhasesSection,
  ProcedureSection,
  ProductionInstructionsSection,
  LOT_STATUS_LABELS,
  getLotStatusStyles,
} from '@/components/laboratorio/shared-presentation';
import LotFollowUpForm from '@/components/laboratorio/lot-follow-up-form';

interface PageProps {
  params: { id: string; lotId: string };
}

function IdentitySection({ lot }: { lot: LotRecord }) {
  return (
    <section className="glass-card rounded-xl p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-on-surface mb-2">{lot.lotCode}</h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Lot number {lot.lotNumber}
          </p>
        </div>
        <span
          className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
        >
          {LOT_STATUS_LABELS[lot.status]}
        </span>
      </div>
    </section>
  );
}

function SourceFormulaSection({ formulaId, formula }: { formulaId: string; formula: { id: string; productName: string; formulaCode: string; formulaVersion: string } }) {
  return (
    <section className="rounded-lg bg-surface-container p-6 space-y-2">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        Source formula
      </h2>
      <p className="font-serif text-xl text-on-surface">{formula.productName}</p>
      <p className="font-sans text-sm text-on-surface-variant">
        {formula.formulaCode} — v{formula.formulaVersion}
      </p>
      <Link
        href={`/laboratorio/formulas/${formulaId}`}
        className="inline-block font-sans text-sm text-primary hover:text-primary/80 transition-colors"
      >
        View formula
      </Link>
    </section>
  );
}

function OperationalSection({ lot }: { lot: LotRecord }) {
  return (
    <SectionCard title="Operational summary">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-sm">
        <div>
          <dt className="font-semibold text-on-surface">Target batch</dt>
          <dd className="text-on-surface-variant">{lot.targetBatchGrams} g</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Status</dt>
          <dd className="text-on-surface-variant">{LOT_STATUS_LABELS[lot.status]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Planned at</dt>
          <dd className="text-on-surface-variant">{formatDate(lot.plannedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Started at</dt>
          <dd className="text-on-surface-variant">{formatDate(lot.startedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Completed at</dt>
          <dd className="text-on-surface-variant">{formatDate(lot.completedAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-on-surface">Operational observations</dt>
          {lot.operationalObservations && lot.operationalObservations.trim() !== '' ? (
            <dd className="text-on-surface-variant whitespace-pre-wrap">
              {lot.operationalObservations}
            </dd>
          ) : (
            <dd>
              <EmptySectionMessage>No observations registered.</EmptySectionMessage>
            </dd>
          )}
        </div>
      </dl>
    </SectionCard>
  );
}

function FormulaSnapshotSection({ snapshot }: { snapshot: LotRecord['formulaSnapshot'] }) {
  return (
    <SectionCard title="Formula snapshot">
      <div className="rounded-lg bg-surface-container p-4 mb-6 space-y-1">
        <p className="font-serif text-lg text-on-surface">{snapshot.productName}</p>
        <p className="font-sans text-sm text-on-surface-variant">
          {snapshot.productType} — {snapshot.targetBatchGrams} g
        </p>
      </div>
      <div className="space-y-6">
        <ProductionInstructionsSection technicalData={snapshot.technicalData} />
        <PhasesSection phases={snapshot.phases} />
        <ProcedureSection steps={snapshot.procedureSteps} />
      </div>
    </SectionCard>
  );
}

function FollowUpSection({ entries }: { entries: Array<{ date: string; note: string }> }) {
  return (
    <SectionCard title="Follow-up">
      {entries.length === 0 ? (
        <EmptySectionMessage>No follow-up entries registered.</EmptySectionMessage>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={`${entry.date}-${entry.note}`} className="font-sans text-sm">
              <span className="block text-on-surface-variant mb-0.5">
                {formatDate(entry.date)}
              </span>
              <p className="text-on-surface">{entry.note}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function AddFollowUpEntrySection({ lotId }: { lotId: string }) {
  return (
    <SectionCard title="Add follow-up entry">
      <LotFollowUpForm
        submitFollowUpEntry={(values) => submitLotFollowUp(lotId, values)}
      />
    </SectionCard>
  );
}

export default async function LaboratoryLotDetailPage({ params }: PageProps) {
  await connectToDatabase();
  const formulaRepo = createFormulaRepository();
  const lotRepo = createLotRepository();

  const formula = await formulaRepo.findById(params.id);

  if (!formula) {
    notFound();
  }

  const lot = await lotRepo.findById(params.lotId);

  if (!lot || lot.formulaId !== formula.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/laboratorio/formulas/${formula.id}`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-sans text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to formula
          </Link>

          <Link
            href={`/laboratorio/formulas/${formula.id}/lotes/${lot.id}/edit`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-sm font-medium"
          >
            Edit lot
          </Link>
        </div>

        <IdentitySection lot={lot} />
        <SourceFormulaSection formulaId={formula.id} formula={formula} />
        <OperationalSection lot={lot} />
        <FormulaSnapshotSection snapshot={lot.formulaSnapshot} />
        <FollowUpSection entries={lot.followUp.entries} />
        <AddFollowUpEntrySection lotId={lot.id} />
      </div>
    </main>
  );
}

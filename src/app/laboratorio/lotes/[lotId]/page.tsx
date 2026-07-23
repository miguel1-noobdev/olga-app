import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository, LotRecord } from '@/lib/db/repository/lot';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { submitLotFollowUp } from './actions';
import {
  EmptySectionMessage,
  formatDate,
  getLotStatusStyles,
  LOT_STATUS_LABELS,
  PhasesSection,
  ProcedureSection,
  ProductionInstructionsSection,
  SectionCard,
} from '@/components/laboratorio/shared-presentation';
import LotFollowUpForm from '@/components/laboratorio/lot-follow-up-form';

interface PageProps {
  params: { lotId: string };
}

function IdentitySection({ lot }: { lot: LotRecord }) {
  return (
    <section className="bg-surface-container border border-[#B6FF00] rounded-2xl p-8 shadow-[0_0_24px_rgba(182,255,0,0.35)]">
      <div data-testid="lot-detail-summary" className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div>
          <p className="font-label text-sm font-semibold uppercase tracking-wider text-primary mb-2">
            Número de Lote
          </p>
          <h1 className="font-headline text-3xl text-on-surface">{lot.lotCode}</h1>
        </div>
        <div className="space-y-4">
          <span
            className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-label font-semibold uppercase tracking-wider ${getLotStatusStyles(lot.status)}`}
          >
            {LOT_STATUS_LABELS[lot.status]}
          </span>
          <FormulaProvenance lot={lot} />
        </div>
      </div>
    </section>
  );
}

function FormulaProvenance({ lot }: { lot: LotRecord }) {
  return (
    <div className="space-y-2">
      <h2 className="font-label text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        Origen de la fórmula
      </h2>
      <p className="font-headline text-xl text-on-surface">{lot.formulaSnapshot.productName}</p>
      <p className="font-body text-sm text-on-surface-variant">
        {lot.formulaCode} — v{lot.formulaVersion}
      </p>
      <Link
        href={`/laboratorio/formulas/${lot.formulaId}`}
        className="inline-block font-body text-sm text-primary hover:text-primary/80 transition-colors"
      >
        Ver fórmula
      </Link>
    </div>
  );
}

function OperationalSection({ lot }: { lot: LotRecord }) {
  return (
    <section
      data-testid="lot-operational-summary"
      className="rounded-2xl border border-[#FF0000] bg-surface-container p-8 shadow-[0_0_24px_rgba(255,0,0,0.35)]"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-headline text-2xl text-[#FF0000]">Resumen operativo</h2>
        <Link
          href={`/laboratorio/lotes/${lot.id}/editar`}
          className="font-label text-sm font-semibold text-[#B6FF00] transition-colors hover:text-[#B6FF00]/80"
        >
          Editar resumen operativo
        </Link>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-body text-sm">
        <div>
          <dt className="font-semibold text-on-surface">Lote objetivo</dt>
          <dd className="text-on-surface-variant">{lot.targetBatchGrams} g</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Estado</dt>
          <dd className="text-on-surface-variant">{LOT_STATUS_LABELS[lot.status]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Fecha de inicio</dt>
          <dd className="text-on-surface-variant">{formatDate(lot.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-on-surface">Fecha de completado</dt>
          <dd className="text-on-surface-variant">{formatDate(lot.completedAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-on-surface">Observaciones operativas</dt>
          <dd className="text-on-surface-variant whitespace-pre-wrap">
            {lot.operationalObservations?.trim() || 'Sin observaciones registradas.'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function FormulaSnapshotSection({ snapshot }: { snapshot: LotRecord['formulaSnapshot'] }) {
  return (
    <SectionCard title="Instantánea de la fórmula">
      <div className="rounded-lg bg-surface-container p-4 mb-6 space-y-1">
        <p className="font-headline text-lg text-on-surface">{snapshot.productName}</p>
        <p className="font-body text-sm text-on-surface-variant">
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

function FollowUpSection({ entries }: { entries: LotRecord['followUp']['entries'] }) {
  return (
    <SectionCard title="Seguimiento">
      {entries.length === 0 ? (
        <EmptySectionMessage>No hay entradas de seguimiento registradas.</EmptySectionMessage>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={`${entry.date}-${entry.note}`} className="font-body text-sm">
              <span className="block text-on-surface-variant mb-0.5">{formatDate(entry.date)}</span>
              <p className="text-on-surface">{entry.note}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export const dynamic = 'force-dynamic';

export default async function LaboratoryLotDetailPage({ params }: PageProps) {
  await connectToDatabase();
  const lot = await createLotRepository().findById(params.lotId);

  if (!lot) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/laboratorio/lotes"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a lotes
        </Link>
        <IdentitySection lot={lot} />
        <OperationalSection lot={lot} />
        <FormulaSnapshotSection snapshot={lot.formulaSnapshot} />
        <FollowUpSection entries={lot.followUp.entries} />
        <SectionCard title="Agregar entrada de seguimiento">
          <LotFollowUpForm submitFollowUpEntry={submitLotFollowUp.bind(null, lot.id)} />
        </SectionCard>
      </div>
    </main>
  );
}

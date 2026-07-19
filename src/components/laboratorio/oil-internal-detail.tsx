import type { ReactNode } from 'react';
import type { OilRecord } from '@/lib/db/repository/oil';
import OilNotesForm from '@/components/laboratorio/oil-notes-form';
import OilReferenceGallery from '@/components/laboratorio/oil-reference-gallery';
import type { OilNotesFormValues, SubmitOilNotesResult } from '@/lib/aceites/oil-notes-form-contract';

function SectionTitle({ icon, children, className }: { icon: string; children: ReactNode; className: string }) {
  return <h2 className={`flex items-center gap-2 font-headline text-lg font-semibold ${className}`}><span aria-hidden="true" className="material-symbols-outlined text-xl">{icon}</span>{children}</h2>;
}

function DetailValue({ label, value, className = '' }: { label: string; value?: string | number | null; className?: string }) {
  return <div><p className="mb-1 font-label text-xs uppercase tracking-wider text-on-surface-variant">{label}</p><p className={`font-body text-lg font-medium text-on-surface ${className}`}>{value === undefined || value === null || value === '' ? 'Sin datos registrados' : value}</p></div>;
}

export default function OilInternalDetail({ oil, submitOilNotes }: { oil: OilRecord; submitOilNotes?: (values: OilNotesFormValues) => Promise<SubmitOilNotesResult> }) {
  return <>
    <header className="mb-8 flex flex-col gap-4 border-b border-surface-container-high pb-6 md:flex-row md:items-end md:justify-between">
      <div><h1 className="font-display text-4xl font-bold tracking-tight text-on-surface md:text-5xl">{oil.name}</h1><p className="mt-2 font-label text-sm uppercase tracking-widest text-on-surface-variant">Ficha interna - Laboratorio Final</p></div>
      <div className="flex items-center gap-2 rounded border border-outline-variant/30 bg-surface-container-high px-3 py-1.5 text-sm"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(43,232,0,0.6)]" /><span className="font-medium text-on-surface-variant">{oil.solubility ?? 'Sin datos registrados'}</span></div>
    </header>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <section className="flex flex-col gap-6 rounded-xl border border-outline-variant/20 bg-surface-container p-6"><SectionTitle icon="science" className="text-primary-dim">Especificaciones</SectionTitle><div className="grid grid-cols-2 gap-x-4 gap-y-6"><DetailValue label="Ingrediente" value={oil.name} /><DetailValue label="HLB" value={oil.hlb} className="font-mono" /><DetailValue label="Fase" value={oil.phase === 'oil' ? 'Oleosa' : oil.phase} className="text-secondary-fixed" /><DetailValue label="Solubilidad" value={oil.solubility} /></div></section>
          <section className="flex flex-col gap-6 rounded-xl border border-outline-variant/20 bg-surface-container p-6"><SectionTitle icon="spa" className="text-secondary-fixed-dim">Aplicación cosmética</SectionTitle><div className="grid grid-cols-2 gap-x-4 gap-y-6"><DetailValue label="Tipo de piel" value={oil.skinTypes.join(', ')} /><DetailValue label="Absorción" value={oil.absorption} /><div className="col-span-2"><p className="mb-1 font-label text-xs uppercase tracking-wider text-on-surface-variant">Propiedades</p>{oil.properties.length > 0 ? <div className="mt-1 flex flex-wrap gap-2">{oil.properties.map((property) => <span key={property} className="rounded-full border border-outline-variant/30 bg-surface-variant px-3 py-1 text-sm text-on-surface">{property}</span>)}</div> : <p className="font-body text-lg font-medium text-on-surface">Sin datos registrados</p>}</div></div></section>
          <section className="flex flex-col gap-6 rounded-xl border border-outline-variant/20 bg-surface-container p-6 md:col-span-2"><SectionTitle icon="note_alt" className="text-on-surface">Notas de formulación</SectionTitle><div className="grid grid-cols-1 gap-6 md:grid-cols-2"><div className="rounded-lg border-l-2 border-outline-variant bg-surface-variant/50 p-4"><DetailValue label="Porcentaje recomendado" value={oil.recommendedPercentage === null ? '—' : `${oil.recommendedPercentage}%`} /></div><div className="rounded-lg border-l-2 border-primary/50 bg-surface-variant/50 p-4"><DetailValue label="Observaciones" value={oil.observations} /></div></div></section>
        </div>
      </div>

      <section className="lg:col-start-3 grid grid-cols-1 gap-4"><h2 className="font-display text-2xl font-bold tracking-tight text-on-surface">Galería de referencia</h2><OilReferenceGallery images={oil.images} /></section>
    </div>
    <footer aria-label="Notas internas" className="mt-6 rounded-lg border border-primary/30 bg-surface-container-low p-6 shadow-[0_0_30px_rgba(156,39,176,0.08)]"><SectionTitle icon="sticky_note_2" className="text-primary">Notas</SectionTitle><p className="mb-4 mt-2 font-body text-sm text-on-surface-variant">Registro editable para el trabajo interno del aceite.</p>{submitOilNotes ? <OilNotesForm initialNotes={oil.notes ?? ''} submitOilNotes={submitOilNotes} /> : <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface-variant">{oil.notes?.trim() ? oil.notes : 'Sin datos registrados'}</p>}</footer>
  </>;
}

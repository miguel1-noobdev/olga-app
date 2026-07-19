import type { ReactNode } from 'react';
import type { FullPlant } from '@/lib/plantas/full-domain';
import PlantNotesForm from '@/components/laboratorio/plant-notes-form';
import type { PlantNotesFormValues, SubmitPlantNotesResult } from '@/lib/plantas/plant-notes-form-contract';

interface PlantInternalDetailProps {
  plant: FullPlant;
  submitPlantNotes?: (values: PlantNotesFormValues) => Promise<SubmitPlantNotesResult>;
}

function SectionTitle({ icon, children, className = 'text-on-background' }: { icon: string; children: ReactNode; className?: string }) {
  return (
    <h2 className={`mb-4 flex items-center gap-2 font-headline text-lg ${className}`}>
      <span aria-hidden="true" className="material-symbols-outlined">{icon}</span>
      {children}
    </h2>
  );
}

function InternalNote({ title, icon, text }: { title: string; icon: string; text?: string }) {
  const displayText = text?.trim() ? text : 'Sin datos registrados';

  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container p-6">
      <SectionTitle icon={icon} className="text-primary">{title}</SectionTitle>
      <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface-variant">{displayText}</p>
    </article>
  );
}

function PropertyGroup({ label, values, accent }: { label: string; values: string[]; accent: 'primary' | 'tertiary' }) {
  const accentClasses = accent === 'tertiary'
    ? 'border-tertiary/20 bg-tertiary/10 text-tertiary'
    : 'border-primary/20 bg-primary/10 text-primary';

  return (
    <div>
      <span className="mb-2 inline-block rounded bg-surface-container-highest px-2 py-1 font-label text-xs uppercase tracking-wide text-on-surface-variant">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <span key={value} className={`rounded-full border px-3 py-1 text-xs font-medium ${accentClasses}`}>{value}</span>)}
      </div>
    </div>
  );
}

export default function PlantInternalDetail({ plant, submitPlantNotes }: PlantInternalDetailProps) {
  const images = plant.images ?? [];
  const internal = plant.internal ?? {};

  return (
    <>
      <header className="mb-10">
        <h1 className="font-headline text-5xl font-black tracking-tighter text-on-background">{plant.commonName}</h1>
        <p className="mt-2 font-body text-xl italic text-on-surface-variant">{plant.scientificName}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-outline-variant bg-surface-container p-6">
            <SectionTitle icon="eco" className="text-primary">Ficha Botánica</SectionTitle>
            {plant.description && <p className="mb-6 font-body text-base leading-relaxed text-on-surface-variant">{plant.description}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Fact label="Familia botánica" value={plant.family} />
              <Fact label="Especie" value={plant.species ?? plant.scientificName} italic />
              {plant.usedParts.length > 0 && <Fact label="Partes utilizadas" value={plant.usedParts.join(', ')} />}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plant.compounds.length > 0 && (
              <section className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
                <SectionTitle icon="science" className="relative z-10 text-secondary">Composición</SectionTitle>
                <ul className="relative z-10 space-y-3 font-body text-sm text-on-surface-variant">
                  {plant.compounds.map((compound) => (
                    <li key={`${compound.name}-${compound.percentage ?? ''}`} className="border-b border-outline-variant/20 pb-2">
                      <div className="flex items-center justify-between gap-4">
                        <span>{compound.name}</span>
                        {compound.percentage && <span className="font-mono text-primary">{compound.percentage}</span>}
                      </div>
                      {compound.description && <p className="mt-1 text-xs text-on-surface-variant">{compound.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(plant.properties.oral.length > 0 || plant.properties.topical.length > 0) && (
              <section className="rounded-lg border border-outline-variant bg-surface-container p-6">
                <SectionTitle icon="health_and_safety" className="text-tertiary">Propiedades</SectionTitle>
                <div className="space-y-4">
                  {plant.properties.oral.length > 0 && <PropertyGroup label="Uso oral" values={plant.properties.oral} accent="tertiary" />}
                  {plant.properties.topical.length > 0 && <PropertyGroup label="Uso tópico" values={plant.properties.topical} accent="primary" />}
                </div>
              </section>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plant.contraindications.length > 0 && (
              <section className="relative rounded-lg border border-error/30 border-l-4 border-l-error bg-surface-container p-6">
                <SectionTitle icon="warning" className="text-error">Contraindicaciones</SectionTitle>
                <ul className="list-inside list-disc space-y-2 font-body text-sm text-on-surface-variant">
                  {plant.contraindications.map((contraindication) => <li key={contraindication}>{contraindication}</li>)}
                </ul>
              </section>
            )}
            {plant.availableExtracts.length > 0 && (
              <section className="rounded-lg border border-outline-variant bg-surface-container p-6">
                <SectionTitle icon="inventory_2">Extractos disponibles</SectionTitle>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plant.availableExtracts.map((extract) => (
                    <li key={`${extract.type}-${extract.method ?? ''}`} className="justify-self-start rounded border border-outline-variant bg-surface-container-high p-3">
                      <p className="font-label text-xs text-on-surface">{extract.type}</p>
                      {extract.method && <p className="mt-1 font-body text-xs text-secondary">{extract.method}</p>}
                      {extract.description && <p className="mt-1 font-body text-xs text-on-surface-variant">{extract.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {images.length > 0 ? (
          <section aria-label="Galería de referencia" className="lg:col-start-3 grid grid-cols-1 gap-4">
              {images.map((image) => (
                <a key={image.url} href={image.url} className="block aspect-video overflow-hidden" target="_blank" rel="noreferrer">
                  <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                </a>
              ))}
          </section>
        ) : (
          <aside className="rounded-lg border border-outline-variant bg-surface-container p-6">
            <p className="rounded border border-dashed border-outline-variant p-4 font-body text-sm text-on-surface-variant">No hay imágenes de referencia cargadas para esta planta.</p>
          </aside>
        )}
      </div>

      <section className="mt-6 rounded-lg border border-outline-variant bg-surface-container-low p-6">
        <SectionTitle icon="folder_managed" className="text-primary">Información interna</SectionTitle>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <InternalNote title="Cultivo" icon="yard" text={internal.cultivationNotes} />
          <InternalNote title="Cosecha" icon="content_cut" text={internal.harvestNotes} />
          <InternalNote title="Origen" icon="local_shipping" text={internal.sourcingNotes} />
          <InternalNote title="Preparación" icon="skillet" text={internal.preparationNotes} />
        </div>
      </section>

      <footer aria-label="Notas internas" className="mt-6 rounded-lg border border-primary/30 bg-surface-container-low p-6 shadow-[0_0_30px_rgba(156,39,176,0.08)]">
        <SectionTitle icon="sticky_note_2" className="text-primary">Notas</SectionTitle>
        <p className="mb-4 font-body text-sm text-on-surface-variant">Registro editable para el trabajo interno de la planta.</p>
        {submitPlantNotes ? (
          <PlantNotesForm initialNotes={internal.notes ?? ''} submitPlantNotes={submitPlantNotes} />
        ) : (
          <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface-variant">
            {internal.notes?.trim() ? internal.notes : 'Sin datos registrados'}
          </p>
        )}
      </footer>
    </>
  );
}

function Fact({ label, value, italic = false }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="rounded border border-outline-variant/50 bg-surface-container-high p-4">
      <span className="mb-1 block font-label text-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className={`font-body font-semibold text-on-background ${italic ? 'italic' : ''}`}>{value}</span>
    </div>
  );
}

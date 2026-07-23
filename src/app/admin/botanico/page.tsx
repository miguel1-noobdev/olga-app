import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { createPlantRepository } from '@/lib/db/repository/plant';

export const dynamic = 'force-dynamic';

export default async function AdminBotanicoPage() {
  await connectToDatabase();
  const [plants, oils] = await Promise.all([
    createPlantRepository().findAll(),
    createOilRepository().findAll(),
  ]);

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-on-surface">Catálogo botánico</h1>
            <p className="font-sans text-lg text-on-surface-variant">
              Administrá las fichas canónicas compartidas con Laboratorio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/botanico/plantas/nueva" className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">
              Nueva planta
            </Link>
            <Link href="/admin/botanico/aceites-extractos/nuevo" className="rounded-lg border border-primary px-5 py-3 font-semibold text-primary">
              Nuevo aceite o extracto
            </Link>
          </div>
        </header>

        <section aria-labelledby="plants-heading" className="rounded-xl border border-white/20 bg-white/50 p-6">
          <h2 id="plants-heading" className="font-serif text-2xl text-on-surface">Plantas</h2>
          <ul className="mt-4 space-y-3">
            {plants.map((plant) => (
              <li key={plant.id} className="flex items-center justify-between gap-4 rounded-lg bg-surface p-4">
                <div>
                  <h3 className="font-semibold text-on-surface">{plant.commonName}</h3>
                  <p className="text-sm text-on-surface-variant">{plant.scientificName} · {plant.family}</p>
                </div>
                <Link href={`/admin/botanico/plantas/${plant.id}/editar`} className="font-semibold text-primary" aria-label={`Editar ${plant.commonName}`}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="oils-heading" className="rounded-xl border border-white/20 bg-white/50 p-6">
          <h2 id="oils-heading" className="font-serif text-2xl text-on-surface">Aceites y extractos</h2>
          <ul className="mt-4 space-y-3">
            {oils.map((oil) => (
              <li key={oil.id} className="flex items-center justify-between gap-4 rounded-lg bg-surface p-4">
                <div>
                  <h3 className="font-semibold text-on-surface">{oil.name}</h3>
                  {oil.inciName && <p className="text-sm text-on-surface-variant">{oil.inciName}</p>}
                </div>
                <Link href={`/admin/botanico/aceites-extractos/${oil.id}/editar`} className="font-semibold text-primary" aria-label={`Editar ${oil.name}`}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

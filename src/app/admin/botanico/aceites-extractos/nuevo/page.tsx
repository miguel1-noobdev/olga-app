import BotanicalEntryForm from '@/components/admin/botanical-entry-form';

export default function NewOilPage() {
  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-4xl text-on-surface">Nuevo aceite o extracto</h1>
          <p className="text-on-surface-variant">Agregá un material al catálogo canónico compartido con Laboratorio.</p>
        </div>
        <BotanicalEntryForm kind="oils" />
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CatalogKind = 'plants' | 'oils';

interface BotanicalEntryFormProps {
  kind: CatalogKind;
  initialValues?: {
    commonName?: string;
    scientificName?: string;
    family?: string;
    name?: string;
    inciName?: string;
    recommendedPercentage?: number | null;
  };
  entryId?: string;
}

function errorMessage(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || !('errors' in payload)) {
    return 'Unable to save the catalog entry.';
  }

  const errors = (payload as { errors: Record<string, string> }).errors;
  return Object.values(errors)[0] ?? 'Unable to save the catalog entry.';
}

export default function BotanicalEntryForm({ kind, initialValues = {}, entryId }: BotanicalEntryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    commonName: String(initialValues.commonName ?? ''),
    scientificName: String(initialValues.scientificName ?? ''),
    family: String(initialValues.family ?? ''),
    name: String(initialValues.name ?? ''),
    inciName: String(initialValues.inciName ?? ''),
    recommendedPercentage: initialValues.recommendedPercentage?.toString() ?? '',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isPlant = kind === 'plants';
  const label = isPlant ? 'planta' : 'aceite o extracto';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    const body = isPlant
      ? { ...(entryId ? { id: entryId } : {}), commonName: values.commonName, scientificName: values.scientificName, family: values.family }
      : {
          ...(entryId ? { id: entryId } : {}),
          name: values.name,
          inciName: values.inciName || undefined,
          recommendedPercentage: values.recommendedPercentage === '' ? null : Number(values.recommendedPercentage),
        };

    try {
      const response = await fetch(`/api/admin/botanico/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(errorMessage(payload));
        return;
      }

      router.push('/admin/botanico');
    } catch {
      setError('Unable to save the catalog entry.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-label={`Formulario de ${label}`}>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {isPlant ? (
        <>
          <label className="block text-sm font-semibold text-on-surface">Nombre común
            <input value={values.commonName} onChange={(event) => setValues({ ...values, commonName: event.target.value })} className="mt-2 w-full rounded-lg border p-3" required />
          </label>
          <label className="block text-sm font-semibold text-on-surface">Nombre científico
            <input value={values.scientificName} onChange={(event) => setValues({ ...values, scientificName: event.target.value })} className="mt-2 w-full rounded-lg border p-3" required />
          </label>
          <label className="block text-sm font-semibold text-on-surface">Familia
            <input value={values.family} onChange={(event) => setValues({ ...values, family: event.target.value })} className="mt-2 w-full rounded-lg border p-3" required />
          </label>
        </>
      ) : (
        <>
          <label className="block text-sm font-semibold text-on-surface">Nombre
            <input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} className="mt-2 w-full rounded-lg border p-3" required />
          </label>
          <label className="block text-sm font-semibold text-on-surface">Nombre INCI
            <input value={values.inciName} onChange={(event) => setValues({ ...values, inciName: event.target.value })} className="mt-2 w-full rounded-lg border p-3" />
          </label>
          <label className="block text-sm font-semibold text-on-surface">Porcentaje recomendado
            <input type="number" value={values.recommendedPercentage} onChange={(event) => setValues({ ...values, recommendedPercentage: event.target.value })} className="mt-2 w-full rounded-lg border p-3" />
          </label>
        </>
      )}
      <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">
        {isSaving ? 'Guardando...' : `Guardar ${label}`}
      </button>
    </form>
  );
}

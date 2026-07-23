'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type OilNotesFormValidationError, type OilNotesFormValues, type SubmitOilNotesResult, validateOilNotesForm } from '@/lib/aceites/oil-notes-form-contract';

export default function OilNotesForm({ initialNotes, submitOilNotes }: { initialNotes: string; submitOilNotes: (values: OilNotesFormValues) => Promise<SubmitOilNotesResult> }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [errors, setErrors] = useState<OilNotesFormValidationError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({}); setSubmitError(null); setSaved(false);
    const values = { notes };
    const validation = validateOilNotesForm(values);
    if (!validation.valid) { setErrors(validation.errors); return; }
    setIsSubmitting(true);
    try {
      const result = await submitOilNotes(values);
      if (result.success) { setSaved(true); router.refresh(); return; }
      if ('errors' in result) setErrors(result.errors); else setSubmitError(result.error);
    } catch {
      setSubmitError('No se pudieron guardar las notas. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit} aria-label="Editar notas internas" className="space-y-4">
    <div><label htmlFor="oil-notes" className="mb-2 block font-label text-xs font-bold uppercase tracking-wider text-primary">Notas</label><textarea id="oil-notes" aria-describedby={errors.notes ? 'oil-notes-error' : undefined} aria-invalid={errors.notes ? 'true' : undefined} value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} maxLength={2000} className="w-full rounded-lg border border-primary/30 bg-surface-container px-4 py-3 font-body text-sm leading-relaxed text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/30" placeholder="Registrar una nota interna para este aceite" />{errors.notes && <p id="oil-notes-error" role="alert" aria-live="polite" className="mt-2 font-body text-sm text-error">{errors.notes}</p>}</div>
    {submitError && <p role="alert" aria-live="assertive" className="rounded-lg border border-error/30 bg-error-container p-3 font-body text-sm text-on-error-container">{submitError}</p>}
    {saved && <p className="font-body text-sm text-primary">Notas guardadas.</p>}
    <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 font-label text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true" className="material-symbols-outlined text-base">save</span>{isSubmitting ? 'Guardando...' : 'Guardar notas'}</button>
  </form>;
}

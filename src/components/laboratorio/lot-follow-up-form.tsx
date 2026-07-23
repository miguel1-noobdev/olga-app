'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LotFollowUpFormValues,
  LotFollowUpFormValidationError,
  SubmitLotFollowUpResult,
  createEmptyLotFollowUpFormValues,
  validateMinimumLotFollowUpForm,
} from '@/lib/lots/lot-follow-up-form-contract';

function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export interface LotFollowUpFormProps {
  initialValues?: LotFollowUpFormValues;
  submitFollowUpEntry: (
    values: LotFollowUpFormValues
  ) => Promise<SubmitLotFollowUpResult>;
}

export default function LotFollowUpForm({
  initialValues,
  submitFollowUpEntry,
}: LotFollowUpFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LotFollowUpFormValues>(
    initialValues ?? createEmptyLotFollowUpFormValues()
  );
  const [requestId] = useState(createClientRequestId);
  const [errors, setErrors] = useState<LotFollowUpFormValidationError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LotFollowUpFormValues>(
    field: K,
    value: LotFollowUpFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setErrors({});

    const validation = validateMinimumLotFollowUpForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFollowUpEntry({ ...values, requestId });

      if (result.success) {
        router.push(result.redirectTo);
        return;
      }

      if ('errors' in result) {
        setErrors(result.errors);
      } else {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError('No se pudo agregar la entrada de seguimiento. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBaseClassName =
    'w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

  const inputErrorClassName =
    'border-error focus:border-error focus:ring-error/50';

  function inputClassName(
    fieldName: keyof LotFollowUpFormValidationError
  ): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName = 'block text-sm font-medium text-on-surface mb-2';

  function FieldError({ name }: { name: keyof LotFollowUpFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-error">{message}</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Agregar entrada de seguimiento"
      className="space-y-6"
    >
      {submitError && (
        <div
          className="rounded-lg bg-error-container border border-error/30 p-4 text-sm text-on-error-container"
          role="alert"
          aria-live="assertive"
        >
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="followUpDate" className={labelClassName}>
            Fecha
          </label>
          <input
            id="followUpDate"
            type="date"
            value={values.date}
            onChange={(event) => updateField('date', event.target.value)}
            className={inputClassName('date')}
          />
          <FieldError name="date" />
        </div>
      </div>

      <div>
        <label htmlFor="followUpNote" className={labelClassName}>
          Nota
        </label>
        <textarea
          id="followUpNote"
          value={values.note}
          onChange={(event) => updateField('note', event.target.value)}
          rows={3}
          className={inputClassName('note')}
          placeholder="p. ej., control de textura, observación de color o nota de estabilidad"
        />
        <FieldError name="note" />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3 bg-primary text-on-primary rounded-full font-label text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Agregando...' : 'Agregar entrada'}
      </button>
    </form>
  );
}

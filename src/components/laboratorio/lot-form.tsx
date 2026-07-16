'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormulaRecord } from '@/lib/formulas/formula-types';
import { LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';
import {
  LotFormValues,
  LotFormValidationError,
  SubmitLotResult,
  createEmptyLotForm,
  validateMinimumLotForm,
} from '@/lib/lots/lot-form-contract';
import { LOT_STATUS_LABELS } from '@/components/laboratorio/shared-presentation';

export interface LotFormProps {
  formula: FormulaRecord;
  submitLot: (values: LotFormValues) => Promise<SubmitLotResult>;
}

export default function LotForm({ formula, submitLot }: LotFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LotFormValues>(
    createEmptyLotForm(formula.id, formula.targetBatchGrams)
  );
  const [errors, setErrors] = useState<LotFormValidationError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LotFormValues>(
    field: K,
    value: LotFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setErrors({});

    const validation = validateMinimumLotForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const result = await submitLot(values);
    setIsSubmitting(false);

    if (!result.success) {
      if ('errors' in result) {
        setErrors(result.errors);
      } else {
        setSubmitError(result.error);
      }
    }
    // Success is handled by the server action redirect.
  }

  const inputBaseClassName =
    'w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

  const inputErrorClassName =
    'border-red-300 focus:border-red-500 focus:ring-red-500/50';

  function inputClassName(fieldName: keyof LotFormValidationError): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName = 'block text-sm font-medium text-on-surface mb-2';

  function FieldError({ name }: { name: keyof LotFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Crear lote" className="space-y-8">
      {submitError && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="rounded-lg bg-surface-container p-6 space-y-2">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          Fórmula origen
        </h2>
        <p className="font-serif text-xl text-on-surface">{formula.productName}</p>
        <p className="font-sans text-sm text-on-surface-variant">
          {formula.formulaCode} — v{formula.formulaVersion}
        </p>
        <p className="font-sans text-sm text-on-surface-variant">
          {formula.targetBatchGrams} g
        </p>
      </div>

      <fieldset className="glass-card rounded-xl p-6 sm:p-8 space-y-6">
        <legend className="font-serif text-xl text-on-surface px-2">Detalles del lote</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="targetBatchGrams" className={labelClassName}>
              Lote objetivo (gramos)
            </label>
            <input
              id="targetBatchGrams"
              type="number"
              min={1}
              step={1}
              value={values.targetBatchGrams}
              onChange={(event) =>
                updateField(
                  'targetBatchGrams',
                  event.target.value === '' ? '' : Number(event.target.value)
                )
              }
              className={`${inputClassName('targetBatchGrams')} sm:w-1/2`}
              placeholder="p. ej., 500"
            />
            <FieldError name="targetBatchGrams" />
          </div>

          <div>
            <label htmlFor="status" className={labelClassName}>
              Estado
            </label>
            <select
              id="status"
              value={values.status}
              onChange={(event) =>
                updateField('status', event.target.value as LotStatus)
              }
              className={inputClassName('status')}
            >
              {LOT_STATUSES.map((lotStatus) => (
                <option key={lotStatus} value={lotStatus}>
                  {LOT_STATUS_LABELS[lotStatus]}
                </option>
              ))}
            </select>
            <FieldError name="status" />
          </div>

          <div>
            <label htmlFor="plannedAt" className={labelClassName}>
              Planificado el (opcional)
            </label>
            <input
              id="plannedAt"
              type="date"
              value={values.plannedAt}
              onChange={(event) => updateField('plannedAt', event.target.value)}
              className={inputClassName('plannedAt')}
            />
            <FieldError name="plannedAt" />
          </div>
        </div>

        <div>
          <label htmlFor="operationalObservations" className={labelClassName}>
            Observaciones operativas (opcional)
          </label>
          <textarea
            id="operationalObservations"
            value={values.operationalObservations}
            onChange={(event) =>
              updateField('operationalObservations', event.target.value)
            }
            rows={3}
            className={inputBaseClassName}
            placeholder="Notas para la corrida de producción"
          />
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-primary text-white rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creando...' : 'Crear lote'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-white/50 text-on-surface rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:bg-white/70 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

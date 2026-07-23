'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';
import {
  LotEditFormValues,
  LotEditFormValidationError,
  LotLifecyclePermissions,
  SubmitLotEditResult,
  validateMinimumLotEditForm,
} from '@/lib/lots/lot-edit-form-contract';
import { LOT_STATUS_LABELS } from '@/components/laboratorio/shared-presentation';

export interface LotEditFormProps {
  initialValues: LotEditFormValues;
  submitLotEdit: (values: LotEditFormValues) => Promise<SubmitLotEditResult>;
  permissions?: LotLifecyclePermissions;
}

export default function LotEditForm({
  initialValues,
  submitLotEdit,
  permissions = {
    canEditProduction: true,
    canRescaleSnapshot: true,
    canAppendFollowUp: true,
  },
}: LotEditFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LotEditFormValues>(initialValues);
  const [errors, setErrors] = useState<LotEditFormValidationError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LotEditFormValues>(
    field: K,
    value: LotEditFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setErrors({});

    const validation = validateMinimumLotEditForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitLotEdit(values);

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
      setSubmitError('No se pudo actualizar el lote. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBaseClassName =
    'w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

  const inputErrorClassName =
    'border-error focus:border-error focus:ring-error/50';

  function inputClassName(fieldName: keyof LotEditFormValidationError): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName = 'block text-sm font-medium text-on-surface mb-2';

  function FieldError({ name }: { name: keyof LotEditFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-error">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Editar lote" className="space-y-8">
      {submitError && (
        <div
          className="rounded-lg bg-error-container border border-error/30 p-4 text-sm text-on-error-container"
          role="alert"
          aria-live="assertive"
        >
          {submitError}
        </div>
      )}

      <fieldset className="bg-surface-container border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <legend className="font-headline text-xl text-on-surface px-2">
          Estado operativo
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              disabled={!permissions.canEditProduction}
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
            <label htmlFor="targetBatchGrams" className={labelClassName}>
              Lote objetivo (g)
            </label>
            <input
              id="targetBatchGrams"
              type="number"
              min="0.01"
              step="0.01"
              value={values.targetBatchGrams ?? ''}
              onChange={(event) => updateField('targetBatchGrams', event.target.value)}
              disabled={!permissions.canRescaleSnapshot}
              className={inputClassName('targetBatchGrams')}
            />
            <FieldError name="targetBatchGrams" />
          </div>

          <div>
            <label htmlFor="completedAt" className={labelClassName}>
              Completado el (opcional)
            </label>
            <input
              id="completedAt"
              type="date"
              value={values.completedAt}
              onChange={(event) =>
                updateField('completedAt', event.target.value)
              }
              disabled={!permissions.canEditProduction}
              className={inputClassName('completedAt')}
            />
            <FieldError name="completedAt" />
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
            disabled={!permissions.canEditProduction}
            rows={3}
            className={inputBaseClassName}
            placeholder="Notas para la corrida de producción"
          />
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !permissions.canEditProduction}
          className="px-8 py-3 bg-primary text-on-primary rounded-full font-label text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar lote'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-surface-container-high text-on-surface border border-surface-border rounded-full font-label text-sm font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

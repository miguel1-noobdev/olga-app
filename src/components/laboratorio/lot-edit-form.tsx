'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';
import {
  LotEditFormValues,
  LotEditFormValidationError,
  SubmitLotEditResult,
  validateMinimumLotEditForm,
} from '@/lib/lots/lot-edit-form-contract';
import { LOT_STATUS_LABELS } from '@/components/laboratorio/shared-presentation';

export interface LotEditFormProps {
  initialValues: LotEditFormValues;
  submitLotEdit: (values: LotEditFormValues) => Promise<SubmitLotEditResult>;
}

export default function LotEditForm({
  initialValues,
  submitLotEdit,
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
    const result = await submitLotEdit(values);
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

  function inputClassName(fieldName: keyof LotEditFormValidationError): string {
    return errors[fieldName]
      ? `${inputBaseClassName} ${inputErrorClassName}`
      : inputBaseClassName;
  }

  const labelClassName = 'block text-sm font-medium text-on-surface mb-2';

  function FieldError({ name }: { name: keyof LotEditFormValidationError }) {
    const message = errors[name];
    if (!message) return null;
    return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Edit lot" className="space-y-8">
      {submitError && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <fieldset className="glass-card rounded-xl p-6 sm:p-8 space-y-6">
        <legend className="font-serif text-xl text-on-surface px-2">
          Operational state
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className={labelClassName}>
              Status
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
              Planned at (optional)
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

          <div>
            <label htmlFor="startedAt" className={labelClassName}>
              Started at (optional)
            </label>
            <input
              id="startedAt"
              type="date"
              value={values.startedAt}
              onChange={(event) => updateField('startedAt', event.target.value)}
              className={inputClassName('startedAt')}
            />
            <FieldError name="startedAt" />
          </div>

          <div>
            <label htmlFor="completedAt" className={labelClassName}>
              Completed at (optional)
            </label>
            <input
              id="completedAt"
              type="date"
              value={values.completedAt}
              onChange={(event) =>
                updateField('completedAt', event.target.value)
              }
              className={inputClassName('completedAt')}
            />
            <FieldError name="completedAt" />
          </div>
        </div>

        <div>
          <label htmlFor="operationalObservations" className={labelClassName}>
            Operational observations (optional)
          </label>
          <textarea
            id="operationalObservations"
            value={values.operationalObservations}
            onChange={(event) =>
              updateField('operationalObservations', event.target.value)
            }
            rows={3}
            className={inputBaseClassName}
            placeholder="Notes for the production run"
          />
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-primary text-white rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update lot'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-white/50 text-on-surface rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:bg-white/70 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

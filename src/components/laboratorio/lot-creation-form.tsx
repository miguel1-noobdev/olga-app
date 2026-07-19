'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormulaRecord } from '@/lib/formulas/formula-types';

export interface LotCreationValues {
  formulaId: string;
  targetBatchGrams: number | '';
}

export type SubmitLotCreationResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

interface LotCreationFormProps {
  formula: FormulaRecord;
  submitLot: (values: LotCreationValues) => Promise<SubmitLotCreationResult>;
}

export default function LotCreationForm({
  formula,
  submitLot,
}: LotCreationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LotCreationValues>({
    formulaId: formula.id,
    targetBatchGrams: formula.targetBatchGrams,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const targetBatchGrams = Number(values.targetBatchGrams);
    if (!Number.isFinite(targetBatchGrams) || targetBatchGrams <= 0) {
      setError('El lote objetivo debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    const result = await submitLot({ ...values, targetBatchGrams });
    setIsSubmitting(false);

    if (result.success) {
      router.push(result.redirectTo);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Crear lote" className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container border border-error/30 p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container-high p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-label text-xs uppercase tracking-wider text-primary">Fórmula origen</p>
            <h2 className="mt-2 break-words font-headline text-2xl font-bold text-on-surface">
              {formula.productName}
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-label font-semibold uppercase tracking-wider text-primary">
            Fórmula validada
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-outline-variant pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <dt className="font-medium text-on-surface-variant">Código</dt>
            <dd className="mt-1 break-all text-on-surface">{formula.formulaCode}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-on-surface-variant">Versión</dt>
            <dd className="mt-1 break-words text-on-surface">v{formula.formulaVersion}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-on-surface-variant">Tipo</dt>
            <dd className="mt-1 break-words text-on-surface">{formula.productType}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-3">
            <dt className="font-medium text-on-surface-variant">Objetivo de fórmula</dt>
            <dd className="mt-1 break-words text-on-surface">{formula.targetBatchGrams} g</dd>
          </div>
        </dl>
      </div>

      <div>
        <label htmlFor="targetBatchGrams" className="block text-sm font-medium text-on-surface mb-2">
          Lote objetivo (gramos)
        </label>
        <input
          id="targetBatchGrams"
          aria-describedby="targetBatchGrams-help"
          type="number"
          min={1}
          step={1}
          value={values.targetBatchGrams}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              targetBatchGrams: event.target.value === '' ? '' : Number(event.target.value),
            }))
          }
          className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface"
        />
      </div>

      <p id="targetBatchGrams-help" className="font-body text-sm text-on-surface-variant">
        Los nuevos lotes comienzan en producción con fecha de inicio automática.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3 bg-primary text-on-primary rounded-full font-label text-sm font-bold uppercase tracking-wider disabled:opacity-50"
      >
        {isSubmitting ? 'Creando...' : 'Crear lote'}
      </button>
    </form>
  );
}

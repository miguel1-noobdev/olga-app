'use client';

import { useState } from 'react';
import { FormulaRecord } from '@/lib/formulas/formula-types';

export interface LotCreationValues {
  formulaId: string;
  targetBatchGrams: number | '';
}

export type SubmitLotCreationResult =
  | { success: true }
  | { success: false; error: string };

interface LotCreationFormProps {
  formulas: FormulaRecord[];
  preselectedFormulaId?: string;
  submitLot: (values: LotCreationValues) => Promise<SubmitLotCreationResult>;
}

export default function LotCreationForm({
  formulas,
  preselectedFormulaId,
  submitLot,
}: LotCreationFormProps) {
  const defaultFormula = formulas.find((formula) => formula.id === preselectedFormulaId) ?? formulas[0];
  const [values, setValues] = useState<LotCreationValues>({
    formulaId: defaultFormula.id,
    targetBatchGrams: defaultFormula.targetBatchGrams,
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

    if (!result.success) {
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

      <div>
        <label htmlFor="formulaId" className="block text-sm font-medium text-on-surface mb-2">
          Fórmula origen
        </label>
        <select
          id="formulaId"
          value={values.formulaId}
          onChange={(event) => {
            const formula = formulas.find((candidate) => candidate.id === event.target.value);
            if (formula) {
              setValues({ formulaId: formula.id, targetBatchGrams: formula.targetBatchGrams });
            }
          }}
          className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-on-surface"
        >
          {formulas.map((formula) => (
            <option key={formula.id} value={formula.id}>
              {formula.productName} — {formula.formulaCode} v{formula.formulaVersion}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="targetBatchGrams" className="block text-sm font-medium text-on-surface mb-2">
          Lote objetivo (gramos)
        </label>
        <input
          id="targetBatchGrams"
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

      <p className="font-body text-sm text-on-surface-variant">Los nuevos lotes comienzan en estado Planeado.</p>

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

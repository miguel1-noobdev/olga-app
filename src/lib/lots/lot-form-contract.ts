import { CreateLotInput, LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';

export interface LotFormValues {
  formulaId: string;
  targetBatchGrams: number | '';
  status: LotStatus;
  plannedAt: string;
  operationalObservations: string;
}

export type LotFormValidationError = Partial<Record<keyof LotFormValues, string>>;

export type SubmitLotResult =
  | { success: true }
  | { success: false; errors: LotFormValidationError }
  | { success: false; error: string };

function toNumberOrNaN(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function createEmptyLotForm(
  formulaId: string,
  defaultTargetBatchGrams: number
): LotFormValues {
  return {
    formulaId,
    targetBatchGrams: defaultTargetBatchGrams,
    status: 'planned',
    plannedAt: '',
    operationalObservations: '',
  };
}

export function toCreateLotInput(values: LotFormValues): CreateLotInput {
  const plannedAt = values.plannedAt.trim();

  return {
    formulaId: values.formulaId,
    targetBatchGrams: toNumberOrNaN(values.targetBatchGrams),
    status: values.status,
    plannedAt: plannedAt ? new Date(plannedAt) : undefined,
    operationalObservations:
      values.operationalObservations.trim() || undefined,
  };
}

export function validateMinimumLotForm(values: LotFormValues): {
  valid: boolean;
  errors: LotFormValidationError;
} {
  const errors: LotFormValidationError = {};

  const targetBatchGrams = toNumberOrNaN(values.targetBatchGrams);
  if (!Number.isFinite(targetBatchGrams) || targetBatchGrams <= 0) {
    errors.targetBatchGrams = 'El lote objetivo debe ser mayor a 0';
  }

  if (!LOT_STATUSES.includes(values.status)) {
    errors.status = 'El estado es obligatorio';
  }

  const plannedAt = values.plannedAt.trim();
  if (plannedAt && Number.isNaN(new Date(plannedAt).getTime())) {
    errors.plannedAt = 'La fecha de planificación no es válida';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

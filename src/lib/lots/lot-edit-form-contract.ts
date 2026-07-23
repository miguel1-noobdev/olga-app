import { UpdateLotInput, LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';
import { strictDate } from '@/lib/validation/runtime-input';

export interface LotEditFormValues {
  status: LotStatus;
  targetBatchGrams?: string;
  plannedAt: string;
  startedAt: string;
  completedAt: string;
  operationalObservations: string;
}

export type LotEditFormValidationError = Partial<
  Record<keyof LotEditFormValues, string>
>;

export type SubmitLotEditResult =
  | { success: true; redirectTo: string }
  | { success: false; errors: LotEditFormValidationError }
  | { success: false; error: string };

export interface LotLifecyclePermissions {
  canEditProduction: boolean;
  canRescaleSnapshot: boolean;
  canAppendFollowUp: boolean;
}

export function getLotLifecyclePermissions(status: LotStatus): LotLifecyclePermissions {
  return {
    canEditProduction: status === 'in_production',
    canRescaleSnapshot: status === 'in_production',
    canAppendFollowUp: true,
  };
}

export function createEmptyLotEditFormValues(): LotEditFormValues {
  return {
    status: 'in_production',
    plannedAt: '',
    startedAt: '',
    completedAt: '',
    operationalObservations: '',
  };
}

function toDateInputValue(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '';
  }

  return isoDate.split('T')[0];
}

export function toLotEditFormValues(record: {
  status: LotStatus;
  targetBatchGrams?: number;
  plannedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  operationalObservations?: string;
}): LotEditFormValues {
  return {
    status: record.status,
    targetBatchGrams:
      record.targetBatchGrams === undefined ? undefined : String(record.targetBatchGrams),
    plannedAt: toDateInputValue(record.plannedAt),
    startedAt: toDateInputValue(record.startedAt),
    completedAt: toDateInputValue(record.completedAt),
    operationalObservations: record.operationalObservations ?? '',
  };
}

export function toUpdateLotInput(values: LotEditFormValues): UpdateLotInput {
  const completedAt = values.completedAt.trim();

  const targetBatchGrams = values.targetBatchGrams?.trim();

  return {
    status: values.status,
    ...(targetBatchGrams ? { targetBatchGrams: Number(targetBatchGrams) } : {}),
    completedAt: completedAt ? new Date(completedAt) : undefined,
    operationalObservations:
      values.operationalObservations.trim() || undefined,
  };
}

export function validateMinimumLotEditForm(values: LotEditFormValues): {
  valid: boolean;
  errors: LotEditFormValidationError;
} {
  const errors: LotEditFormValidationError = {};

  if (!LOT_STATUSES.includes(values.status)) {
    errors.status = 'El estado es obligatorio';
  }

  const targetBatchGrams = values.targetBatchGrams?.trim();
  if (
    targetBatchGrams &&
    (!Number.isFinite(Number(targetBatchGrams)) || Number(targetBatchGrams) <= 0 || Number(targetBatchGrams) > 1_000_000)
  ) {
    errors.targetBatchGrams = 'El lote objetivo debe ser mayor a 0';
  }

  for (const [field, label] of [
    ['plannedAt', 'planificación'],
    ['startedAt', 'inicio'],
    ['completedAt', 'finalización'],
  ] as const) {
    const date = values[field].trim();
    if (!date) continue;
    try {
      strictDate(date, field);
    } catch {
      errors[field] = `La fecha de ${label} no es válida`;
    }
  }

  if (values.operationalObservations.trim().length > 2_000) {
    errors.operationalObservations = 'Las observaciones no pueden superar los 2000 caracteres';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

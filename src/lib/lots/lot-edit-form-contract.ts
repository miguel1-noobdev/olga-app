import { UpdateLotInput, LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';

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

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
    (!Number.isFinite(Number(targetBatchGrams)) || Number(targetBatchGrams) <= 0)
  ) {
    errors.targetBatchGrams = 'El lote objetivo debe ser mayor a 0';
  }

  const completedAt = values.completedAt.trim();
  if (completedAt && !isValidDateInput(completedAt)) {
    errors.completedAt = 'La fecha de finalización no es válida';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

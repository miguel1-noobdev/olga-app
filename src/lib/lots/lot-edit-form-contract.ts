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
  | { success: true }
  | { success: false; errors: LotEditFormValidationError }
  | { success: false; error: string };

export interface LotLifecyclePermissions {
  canEditProduction: boolean;
  canRescaleSnapshot: boolean;
  canAppendFollowUp: boolean;
}

export function getLotLifecyclePermissions(status: LotStatus): LotLifecyclePermissions {
  return {
    canEditProduction: status !== 'completed',
    canRescaleSnapshot: status === 'planned' || status === 'cancelled',
    canAppendFollowUp: true,
  };
}

export function createEmptyLotEditFormValues(): LotEditFormValues {
  return {
    status: 'planned',
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
  const plannedAt = values.plannedAt.trim();
  const startedAt = values.startedAt.trim();
  const completedAt = values.completedAt.trim();

  const targetBatchGrams = values.targetBatchGrams?.trim();

  return {
    status: values.status,
    ...(targetBatchGrams ? { targetBatchGrams: Number(targetBatchGrams) } : {}),
    plannedAt: plannedAt ? new Date(plannedAt) : undefined,
    startedAt: startedAt ? new Date(startedAt) : undefined,
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

  const plannedAt = values.plannedAt.trim();
  if (plannedAt && Number.isNaN(new Date(plannedAt).getTime())) {
    errors.plannedAt = 'La fecha de planificación no es válida';
  }

  const startedAt = values.startedAt.trim();
  if (startedAt && Number.isNaN(new Date(startedAt).getTime())) {
    errors.startedAt = 'La fecha de inicio no es válida';
  }

  const completedAt = values.completedAt.trim();
  if (completedAt && Number.isNaN(new Date(completedAt).getTime())) {
    errors.completedAt = 'La fecha de finalización no es válida';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

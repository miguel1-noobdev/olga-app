import { UpdateLotInput, LOT_STATUSES, LotStatus } from '@/lib/lots/lot-types';

export interface LotEditFormValues {
  status: LotStatus;
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
  plannedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  operationalObservations?: string;
}): LotEditFormValues {
  return {
    status: record.status,
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

  return {
    status: values.status,
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
    errors.status = 'Status is required';
  }

  const plannedAt = values.plannedAt.trim();
  if (plannedAt && Number.isNaN(new Date(plannedAt).getTime())) {
    errors.plannedAt = 'Planned date is invalid';
  }

  const startedAt = values.startedAt.trim();
  if (startedAt && Number.isNaN(new Date(startedAt).getTime())) {
    errors.startedAt = 'Started date is invalid';
  }

  const completedAt = values.completedAt.trim();
  if (completedAt && Number.isNaN(new Date(completedAt).getTime())) {
    errors.completedAt = 'Completed date is invalid';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

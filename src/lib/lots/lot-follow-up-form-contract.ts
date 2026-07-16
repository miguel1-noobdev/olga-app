import { LotFollowUpEntry } from '@/lib/lots/lot-types';

export interface LotFollowUpFormValues {
  date: string;
  note: string;
}

export type LotFollowUpFormValidationError = Partial<
  Record<keyof LotFollowUpFormValues, string>
>;

export type SubmitLotFollowUpResult =
  | { success: true }
  | { success: false; errors: LotFollowUpFormValidationError }
  | { success: false; error: string };

export function createEmptyLotFollowUpFormValues(): LotFollowUpFormValues {
  return {
    date: '',
    note: '',
  };
}

export function toLotFollowUpEntry(
  values: LotFollowUpFormValues
): LotFollowUpEntry {
  return {
    date: new Date(values.date),
    note: values.note.trim(),
  };
}

export function validateMinimumLotFollowUpForm(values: LotFollowUpFormValues): {
  valid: boolean;
  errors: LotFollowUpFormValidationError;
} {
  const errors: LotFollowUpFormValidationError = {};

  const date = values.date.trim();
  if (!date) {
    errors.date = 'La fecha es obligatoria';
  } else if (Number.isNaN(new Date(date).getTime())) {
    errors.date = 'La fecha no es válida';
  }

  const note = values.note.trim();
  if (!note) {
    errors.note = 'La nota es obligatoria';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

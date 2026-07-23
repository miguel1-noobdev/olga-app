import { LotFollowUpEntry } from '@/lib/lots/lot-types';
import { strictDate } from '@/lib/validation/runtime-input';

export interface LotFollowUpFormValues {
  date: string;
  note: string;
}

export type LotFollowUpFormValidationError = Partial<
  Record<keyof LotFollowUpFormValues, string>
>;

export type SubmitLotFollowUpResult =
  | { success: true; redirectTo: string }
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
  } else {
    try {
      strictDate(date, 'date');
    } catch {
      errors.date = 'La fecha no es válida';
    }
  }

  const note = values.note.trim();
  if (!note) {
    errors.note = 'La nota es obligatoria';
  } else if (note.length > 2_000) {
    errors.note = 'La nota no puede superar los 2000 caracteres';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

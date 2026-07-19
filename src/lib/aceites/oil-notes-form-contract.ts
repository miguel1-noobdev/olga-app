export interface OilNotesFormValues {
  notes: string;
}

export type OilNotesFormValidationError = Partial<Record<keyof OilNotesFormValues, string>>;

export type SubmitOilNotesResult =
  | { success: true }
  | { success: false; errors: OilNotesFormValidationError }
  | { success: false; error: string };

export function validateOilNotesForm(values: OilNotesFormValues): { valid: boolean; errors: OilNotesFormValidationError } {
  return values.notes.length > 2000
    ? { valid: false, errors: { notes: 'Las notas no pueden superar los 2000 caracteres' } }
    : { valid: true, errors: {} };
}

export interface PlantNotesFormValues {
  notes: string;
}

export type PlantNotesFormValidationError = Partial<
  Record<keyof PlantNotesFormValues, string>
>;

export type SubmitPlantNotesResult =
  | { success: true }
  | { success: false; errors: PlantNotesFormValidationError }
  | { success: false; error: string };

export function validatePlantNotesForm(values: PlantNotesFormValues): {
  valid: boolean;
  errors: PlantNotesFormValidationError;
} {
  if (values.notes.length > 2000) {
    return {
      valid: false,
      errors: { notes: 'Las notas no pueden superar los 2000 caracteres' },
    };
  }

  return { valid: true, errors: {} };
}

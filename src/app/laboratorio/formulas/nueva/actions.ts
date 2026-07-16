'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import {
  FormulaFormValues,
  SubmitFormulaResult,
  toCreateFormulaInput,
  validateMinimumFormulaForm,
} from '@/lib/formulas/formula-form-contract';

export async function submitFormula(values: FormulaFormValues): Promise<SubmitFormulaResult> {
  const validation = validateMinimumFormulaForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await connectToDatabase();
  const repository = createFormulaRepository();

  try {
    const record = await repository.create(toCreateFormulaInput(values));
    redirect(`/laboratorio/formulas/${record.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar la fórmula. Inténtelo de nuevo.',
    };
  }
}

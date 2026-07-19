'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import {
  FormulaFormValues,
  SubmitFormulaResult,
  toCreateFormulaInput,
  validateMinimumFormulaForm,
} from '@/lib/formulas/formula-form-contract';

export async function submitFormula(values: FormulaFormValues): Promise<SubmitFormulaResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: 'No autorizado' };
  }

  const validation = validateMinimumFormulaForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await connectToDatabase();
  const repository = createFormulaRepository();

  try {
    const record = await repository.create(toCreateFormulaInput(values));
    return {
      success: true,
      redirectTo: `/laboratorio/formulas/${record.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar la fórmula. Inténtelo de nuevo.',
    };
  }
}

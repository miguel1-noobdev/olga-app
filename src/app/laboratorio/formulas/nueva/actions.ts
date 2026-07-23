'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import {
  FormulaFormValues,
  SubmitFormulaResult,
  toCreateFormulaInput,
  validateRuntimeFormulaForm,
  validateMinimumFormulaForm,
} from '@/lib/formulas/formula-form-contract';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function submitFormula(values: FormulaFormValues): Promise<SubmitFormulaResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    const runtimeValidation = validateRuntimeFormulaForm(values);
    if (!runtimeValidation.valid) {
      return { success: false, errors: runtimeValidation.errors };
    }

    const validation = validateMinimumFormulaForm(values);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await connectToDatabase();
    const repository = createFormulaRepository();
    const record = await repository.create(toCreateFormulaInput(values));
    return {
      success: true,
      redirectTo: `/laboratorio/formulas/${record.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudo guardar la fórmula. Inténtelo de nuevo.'),
    };
  }
}

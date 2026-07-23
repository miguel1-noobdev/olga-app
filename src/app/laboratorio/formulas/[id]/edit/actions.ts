'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import {
  FormulaFormValues,
  SubmitFormulaResult,
  toUpdateFormulaInput,
  validateRuntimeFormulaForm,
  validateMinimumFormulaForm,
} from '@/lib/formulas/formula-form-contract';
import { objectId } from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function submitFormulaUpdate(
  formulaId: string,
  values: FormulaFormValues
): Promise<SubmitFormulaResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    try {
      objectId(formulaId, 'formula id');
    } catch {
      return { success: false, error: 'Entrada inválida' };
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
    const record = await repository.update(formulaId, toUpdateFormulaInput(values));
    return {
      success: true,
      redirectTo: `/laboratorio/formulas/${record.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudo actualizar la fórmula. Inténtelo de nuevo.'),
    };
  }
}

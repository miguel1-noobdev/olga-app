'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import type { LotCreationValues, SubmitLotCreationResult } from '@/components/laboratorio/lot-creation-form';
import {
  assertAllowedKeys,
  assertRecord,
  boundedRequestId,
  finiteNumber,
  objectId,
} from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function submitNewLot(
  values: LotCreationValues
): Promise<SubmitLotCreationResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    let safeValues: LotCreationValues;
    let targetBatchGrams: number;
    try {
      const body = assertRecord(values);
      assertAllowedKeys(body, ['formulaId', 'targetBatchGrams', 'creationRequestId']);
      const formulaId = objectId(body.formulaId, 'formula id');
      targetBatchGrams = finiteNumber(body.targetBatchGrams, 'target batch grams', { min: 0.0001, max: 1_000_000 });
      safeValues = {
        formulaId,
        targetBatchGrams,
        creationRequestId: boundedRequestId(body.creationRequestId, 'creation request id'),
      };
    } catch {
      return { success: false, error: 'Entrada inválida' };
    }

    await connectToDatabase();
    const formulaRepository = createFormulaRepository();
    const formula = await formulaRepository.findById(safeValues.formulaId);

    if (!formula || formula.status !== 'validated') {
      return { success: false, error: 'La fórmula ya no está validada para la creación de lotes.' };
    }

    const lot = await createLotRepository().create({
      formulaId: formula.id,
      targetBatchGrams,
      status: 'in_production',
      creationRequestId: safeValues.creationRequestId,
    });

    return {
      success: true,
      redirectTo: `/laboratorio/lotes/${lot.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudo crear el lote. Intentelo de nuevo.'),
    };
  }
}

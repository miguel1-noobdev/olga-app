'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import {
  getLotLifecyclePermissions,
  LotEditFormValues,
  SubmitLotEditResult,
  toUpdateLotInput,
  validateMinimumLotEditForm,
} from '@/lib/lots/lot-edit-form-contract';
import {
  assertAllowedKeys,
  assertRecord,
  boundedString,
  objectId,
  optionalString,
} from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function submitLotEditUpdate(
  lotId: string,
  values: LotEditFormValues
): Promise<SubmitLotEditResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    let safeValues: LotEditFormValues;
    try {
      objectId(lotId, 'lot id');
      const body = assertRecord(values);
      assertAllowedKeys(body, [
        'status', 'targetBatchGrams', 'plannedAt', 'startedAt', 'completedAt', 'operationalObservations',
      ]);
      safeValues = {
        status: body.status as LotEditFormValues['status'],
        targetBatchGrams: optionalString(body.targetBatchGrams, 'targetBatchGrams', { maxLength: 20 }),
        plannedAt: boundedString(body.plannedAt, 'plannedAt', { maxLength: 10, required: false }),
        startedAt: boundedString(body.startedAt, 'startedAt', { maxLength: 10, required: false }),
        completedAt: boundedString(body.completedAt, 'completedAt', { maxLength: 10, required: false }),
        operationalObservations: boundedString(body.operationalObservations, 'operationalObservations', { maxLength: 2_000, required: false }),
      };
    } catch {
      return { success: false, error: 'Entrada inválida' };
    }

    const validation = validateMinimumLotEditForm(safeValues);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await connectToDatabase();
    const repository = createLotRepository();
    const currentLot = await repository.findById(lotId);
    if (!currentLot) {
      return { success: false, error: 'Lote no encontrado' };
    }

    if (currentLot.status === 'finalized' || currentLot.status === 'discarded') {
      return { success: false, error: 'El lote no puede modificarse después de finalizarse o descartarse' };
    }

    const update = toUpdateLotInput(safeValues);
    const permissions = getLotLifecyclePermissions(currentLot.status);
    if (update.targetBatchGrams === currentLot.targetBatchGrams) {
      delete update.targetBatchGrams;
    }

    if (!permissions.canRescaleSnapshot && update.targetBatchGrams !== undefined) {
      return { success: false, error: 'La instantánea del lote no puede reescalarse en su estado actual' };
    }

    const record = await repository.update(lotId, update);
    return { success: true, redirectTo: `/laboratorio/lotes/${record.id}` };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudo actualizar el lote. Intentelo de nuevo.'),
    };
  }
}

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

export async function submitLotEditUpdate(
  lotId: string,
  values: LotEditFormValues
): Promise<SubmitLotEditResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: 'No autorizado' };
  }

  const validation = validateMinimumLotEditForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    await connectToDatabase();
    const repository = createLotRepository();
    const currentLot = await repository.findById(lotId);
    if (!currentLot) {
      return { success: false, error: 'Lote no encontrado' };
    }

    if (currentLot.status === 'finalized' || currentLot.status === 'discarded') {
      return { success: false, error: 'El lote no puede modificarse después de finalizarse o descartarse' };
    }

    const update = toUpdateLotInput(values);
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
      error: error instanceof Error ? error.message : 'No se pudo actualizar el lote. Intentelo de nuevo.',
    };
  }
}

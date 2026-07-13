'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
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
  const validation = validateMinimumLotEditForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await connectToDatabase();
  const repository = createLotRepository();

  try {
    const currentLot = await repository.findById(lotId);
    if (!currentLot) {
      return { success: false, error: 'Lot not found' };
    }

    const update = toUpdateLotInput(values);
    const permissions = getLotLifecyclePermissions(currentLot.status);
    if (update.targetBatchGrams === currentLot.targetBatchGrams) {
      delete update.targetBatchGrams;
    }

    if (!permissions.canRescaleSnapshot && update.targetBatchGrams !== undefined) {
      return { success: false, error: 'Lot snapshot cannot be rescaled in its current status' };
    }

    const record = await repository.update(lotId, update);
    redirect(`/laboratorio/lotes/${record.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lot. Please try again.',
    };
  }
}

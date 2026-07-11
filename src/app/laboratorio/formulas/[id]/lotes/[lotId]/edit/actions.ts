'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
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
    const record = await repository.update(lotId, toUpdateLotInput(values));
    redirect(`/laboratorio/formulas/${record.formulaId}/lotes/${record.id}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update lot. Please try again.',
    };
  }
}

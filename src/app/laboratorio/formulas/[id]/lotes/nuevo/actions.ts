'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
  LotFormValues,
  SubmitLotResult,
  toCreateLotInput,
  validateMinimumLotForm,
} from '@/lib/lots/lot-form-contract';

export async function submitLot(
  formulaId: string,
  values: LotFormValues
): Promise<SubmitLotResult> {
  const validation = validateMinimumLotForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await connectToDatabase();
  const repository = createLotRepository();

  try {
    const record = await repository.create(
      toCreateLotInput({ ...values, formulaId })
    );
    redirect(`/laboratorio/formulas/${record.formulaId}`);
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
          : 'Failed to create lot. Please try again.',
    };
  }
}

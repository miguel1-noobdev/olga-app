'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import {
  LotFollowUpFormValues,
  SubmitLotFollowUpResult,
  toLotFollowUpEntry,
  validateMinimumLotFollowUpForm,
} from '@/lib/lots/lot-follow-up-form-contract';

export async function submitLotFollowUp(
  lotId: string,
  values: LotFollowUpFormValues
): Promise<SubmitLotFollowUpResult> {
  const validation = validateMinimumLotFollowUpForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await connectToDatabase();
  const repository = createLotRepository();

  try {
    const record = await repository.update(lotId, {
      followUp: { entries: [toLotFollowUpEntry(values)] },
    });
    redirect(`/laboratorio/lotes/${record.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.',
    };
  }
}

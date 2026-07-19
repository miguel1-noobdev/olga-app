'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createLotRepository } from '@/lib/db/repository/lot';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
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
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: 'No autorizado' };
  }

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
    return {
      success: true,
      redirectTo: `/laboratorio/lotes/${record.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.',
    };
  }
}

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
import {
  assertAllowedKeys,
  assertRecord,
  boundedRequestId,
  boundedString,
  objectId,
} from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function submitLotFollowUp(
  lotId: string,
  values: LotFollowUpFormValues
): Promise<SubmitLotFollowUpResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    let safeValues: LotFollowUpFormValues;
    try {
      objectId(lotId, 'lot id');
      const body = assertRecord(values);
      assertAllowedKeys(body, ['date', 'note', 'requestId']);
      safeValues = {
        date: boundedString(body.date, 'date', { maxLength: 10, required: false }),
        note: boundedString(body.note, 'note', { maxLength: 2_000, required: false }),
        requestId: boundedRequestId(body.requestId, 'follow-up request id'),
      };
    } catch {
      return { success: false, error: 'Entrada inválida' };
    }

    const validation = validateMinimumLotFollowUpForm(safeValues);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await connectToDatabase();
    const repository = createLotRepository();

    const record = await repository.update(lotId, {
      followUp: { entries: [toLotFollowUpEntry(safeValues)] },
    });
    return {
      success: true,
      redirectTo: `/laboratorio/lotes/${record.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.'),
    };
  }
}

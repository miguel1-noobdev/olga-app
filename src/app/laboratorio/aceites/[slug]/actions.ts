'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import { type OilNotesFormValues, type SubmitOilNotesResult, validateOilNotesForm } from '@/lib/aceites/oil-notes-form-contract';
import {
  assertAllowedKeys,
  assertRecord,
  boundedString,
  objectId,
} from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function updateOilNotes(oilId: string, slug: string, values: OilNotesFormValues): Promise<SubmitOilNotesResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) return { success: false, error: 'No autorizado' };

    let safeValues: OilNotesFormValues;
    try {
      objectId(oilId, 'oil id');
      const body = assertRecord(values);
      assertAllowedKeys(body, ['notes']);
      if (typeof body.notes === 'string' && body.notes.length > 2_000) {
        return { success: false, errors: { notes: 'Las notas no pueden superar los 2000 caracteres' } };
      }
      const safeSlug = boundedString(slug, 'slug', { minLength: 1, maxLength: 160 });
      if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(safeSlug)) throw new Error('Invalid slug');
      safeValues = { notes: boundedString(body.notes, 'notes', { maxLength: 2_000, required: false }) };
    } catch {
      return { success: false, error: 'Entrada inválida' };
    }

    const validation = validateOilNotesForm(safeValues);
    if (!validation.valid) return { success: false, errors: validation.errors };

    await connectToDatabase();
    await createOilRepository().update(oilId, { notes: safeValues.notes.trim() });
    revalidatePath(`/laboratorio/aceites/${slug.trim()}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudieron guardar las notas. Inténtelo de nuevo.'),
    };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db/connect';
import { createFullPlantRepository } from '@/lib/plantas/full-domain';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import {
  type PlantNotesFormValues,
  type SubmitPlantNotesResult,
  validatePlantNotesForm,
} from '@/lib/plantas/plant-notes-form-contract';
import {
  assertAllowedKeys,
  assertRecord,
  boundedString,
  objectId,
} from '@/lib/validation/runtime-input';
import { getSafeServerActionError } from '@/lib/server-action-error';

export async function updatePlantNotes(
  plantId: string,
  slug: string,
  values: PlantNotesFormValues
): Promise<SubmitPlantNotesResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: 'No autorizado' };
    }

    let safeValues: PlantNotesFormValues;
    try {
      objectId(plantId, 'plant id');
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

    const validation = validatePlantNotesForm(safeValues);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await connectToDatabase();
    await createFullPlantRepository().update(plantId, {
      internal: { notes: safeValues.notes.trim() },
    });
    revalidatePath(`/laboratorio/plantas/${slug.trim()}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getSafeServerActionError(error, 'No se pudieron guardar las notas. Inténtelo de nuevo.'),
    };
  }
}

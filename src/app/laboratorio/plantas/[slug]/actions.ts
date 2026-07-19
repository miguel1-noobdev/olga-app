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

export async function updatePlantNotes(
  plantId: string,
  slug: string,
  values: PlantNotesFormValues
): Promise<SubmitPlantNotesResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: 'No autorizado' };
  }

  const validation = validatePlantNotesForm(values);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    await connectToDatabase();
    await createFullPlantRepository().update(plantId, {
      internal: { notes: values.notes.trim() },
    });
    revalidatePath(`/laboratorio/plantas/${slug}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron guardar las notas. Inténtelo de nuevo.',
    };
  }
}

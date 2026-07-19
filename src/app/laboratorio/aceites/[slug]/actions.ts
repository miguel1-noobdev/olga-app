'use server';

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import { type OilNotesFormValues, type SubmitOilNotesResult, validateOilNotesForm } from '@/lib/aceites/oil-notes-form-contract';

export async function updateOilNotes(oilId: string, slug: string, values: OilNotesFormValues): Promise<SubmitOilNotesResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { success: false, error: 'No autorizado' };

  const validation = validateOilNotesForm(values);
  if (!validation.valid) return { success: false, errors: validation.errors };
  try {
    await connectToDatabase();
    await createOilRepository().update(oilId, { notes: values.notes.trim() });
    revalidatePath(`/laboratorio/aceites/${slug}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudieron guardar las notas. Inténtelo de nuevo.' };
  }
}

'use server';

import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import type { LotCreationValues, SubmitLotCreationResult } from '@/components/laboratorio/lot-creation-form';

export async function submitNewLot(
  values: LotCreationValues
): Promise<SubmitLotCreationResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: 'No autorizado' };
  }

  const targetBatchGrams = Number(values.targetBatchGrams);
  if (!Number.isFinite(targetBatchGrams) || targetBatchGrams <= 0) {
    return { success: false, error: 'El lote objetivo debe ser mayor a 0' };
  }

  await connectToDatabase();
  const formulaRepository = createFormulaRepository();
  const formula = await formulaRepository.findById(values.formulaId);

  if (!formula || formula.status !== 'validated') {
    return { success: false, error: 'La fórmula ya no está validada para la creación de lotes.' };
  }

  try {
    const lot = await createLotRepository().create({
      formulaId: formula.id,
      targetBatchGrams,
      status: 'in_production',
    });

    return {
      success: true,
      redirectTo: `/laboratorio/lotes/${lot.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo crear el lote. Intentelo de nuevo.',
    };
  }
}

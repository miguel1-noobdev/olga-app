'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import type { LotCreationValues, SubmitLotCreationResult } from '@/components/laboratorio/lot-creation-form';

export async function submitNewLot(
  values: LotCreationValues
): Promise<SubmitLotCreationResult> {
  const targetBatchGrams = Number(values.targetBatchGrams);
  if (!Number.isFinite(targetBatchGrams) || targetBatchGrams <= 0) {
    return { success: false, error: 'Target batch must be greater than 0' };
  }

  await connectToDatabase();
  const formulaRepository = createFormulaRepository();
  const formula = await formulaRepository.findById(values.formulaId);

  if (!formula || formula.status !== 'validated') {
    return { success: false, error: 'Formula is no longer validated for lot creation.' };
  }

  try {
    const lot = await createLotRepository().create({
      formulaId: formula.id,
      targetBatchGrams,
      status: 'planned',
    });
    redirect(`/laboratorio/lotes/${lot.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create lot. Please try again.',
    };
  }
}

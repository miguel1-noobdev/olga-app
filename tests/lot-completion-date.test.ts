import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createLotRepository } from '@/lib/db/repository/lot';
import { FormulaModel } from '@/lib/db/models/formula';
import { LotModel } from '@/lib/db/models/lot';
import { validateMinimumLotEditForm } from '@/lib/lots/lot-edit-form-contract';

describe('LotRepository completion date lifecycle', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createLotRepository>;
  let formulaId: string;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await LotModel.syncIndexes();
    await FormulaModel.syncIndexes();
    repo = createLotRepository();

    const formula = await FormulaModel.create({
      productName: 'Crema de lavanda',
      formulaCode: 'CF-001',
      formulaCreatedAt: new Date('2026-01-15'),
      formulaVersion: '1.0',
      productObjectives: ['hidratante'],
      productType: 'crema',
      status: 'validated',
      targetBatchGrams: 500,
      procedureSteps: [{ stepNumber: 1, instruction: 'Mezclar' }],
    });

    formulaId = formula._id.toString();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T15:30:00.000Z'));
  });

  afterEach(async () => {
    vi.useRealTimers();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it.each(['finalized', 'discarded'] as const)(
    'sets today as the completion date when updated to %s without one',
    async (status) => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      const updated = await repo.update(lot.id, { status });

      expect(updated.completedAt).toBe('2026-07-18T00:00:00.000Z');
    }
  );

  it('retains an explicit valid completion date', async () => {
    const lot = await repo.create({ formulaId, targetBatchGrams: 500 });
    const completedAt = new Date('2026-07-02T00:00:00.000Z');

    const updated = await repo.update(lot.id, { status: 'finalized', completedAt });

    expect(updated.completedAt).toBe(completedAt.toISOString());
  });

  it('leaves the completion date absent when updated to in_production without one', async () => {
    const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

    const updated = await repo.update(lot.id, { status: 'in_production' });

    expect(updated.completedAt).toBeNull();
  });

  it('continues rejecting invalid completion dates before persistence', () => {
    expect(
      validateMinimumLotEditForm({
        status: 'finalized',
        targetBatchGrams: '',
        plannedAt: '',
        startedAt: '',
        completedAt: '2026-02-30',
        operationalObservations: '',
      })
    ).toEqual({
      valid: false,
      errors: { completedAt: 'La fecha de finalización no es válida' },
    });
  });
});

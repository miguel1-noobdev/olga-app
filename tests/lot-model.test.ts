import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { LotModel } from '@/lib/db/models/lot';
import { FormulaModel } from '@/lib/db/models/formula';

describe('LotModel', () => {
  let mongoServer: MongoMemoryServer;
  let formulaId: string;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await LotModel.syncIndexes();

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
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function validLotInput() {
    return {
      formulaId,
      formulaCode: 'CF-001',
      formulaVersion: '1.0',
      lotNumber: 1,
      lotCode: 'CF-001-L001',
      status: 'planned' as const,
      targetBatchGrams: 500,
      formulaSnapshot: {
        productName: 'Crema de lavanda',
        productType: 'crema',
        targetBatchGrams: 500,
        phases: {
          aqueous: [{ ingredient: 'Agua destilada', grams: 300 }],
          oil: [{ ingredient: 'Aceite de almendras', grams: 150 }],
          actives: [{ ingredient: 'Extracto de lavanda', grams: 50 }],
        },
        procedureSteps: [{ stepNumber: 1, instruction: 'Mezclar' }],
        technicalData: {
          productionTemperatureCelsius: 65,
          mixingTimeMinutes: 20,
          preservative: 'Cosgard',
        },
      },
    };
  }

  it('persists a complete lot with snapshot and identity', async () => {
    const lot = await LotModel.create(validLotInput());

    expect(lot.formulaId.toString()).toBe(formulaId);
    expect(lot.formulaCode).toBe('CF-001');
    expect(lot.formulaVersion).toBe('1.0');
    expect(lot.lotNumber).toBe(1);
    expect(lot.lotCode).toBe('CF-001-L001');
    expect(lot.status).toBe('planned');
    expect(lot.targetBatchGrams).toBe(500);
    expect(lot.formulaSnapshot.productName).toBe('Crema de lavanda');
    expect(lot.formulaSnapshot.phases?.oil).toHaveLength(1);
  });

  it('persists production technical data inside the formula snapshot', async () => {
    const lot = await LotModel.create(validLotInput());

    expect(lot.formulaSnapshot.technicalData?.productionTemperatureCelsius).toBe(65);
    expect(lot.formulaSnapshot.technicalData?.mixingTimeMinutes).toBe(20);
    expect(lot.formulaSnapshot.technicalData?.preservative).toBe('Cosgard');
  });

  it('leaves technical data undefined when not provided in the snapshot', async () => {
    const input = {
      ...validLotInput(),
      formulaSnapshot: {
        ...validLotInput().formulaSnapshot,
        technicalData: undefined,
      },
    };

    const lot = await LotModel.create(input);

    expect(lot.formulaSnapshot.technicalData).toBeUndefined();
  });

  it('rejects when required identity fields are missing', async () => {
    await expect(LotModel.create({})).rejects.toThrow();
  });

  it('rejects an invalid status value', async () => {
    await expect(
      LotModel.create({
        ...validLotInput(),
        status: 'invalid-status' as unknown as 'planned',
      })
    ).rejects.toThrow();
  });

  it('rejects targetBatchGrams less than or equal to zero', async () => {
    await expect(
      LotModel.create({
        ...validLotInput(),
        targetBatchGrams: 0,
      })
    ).rejects.toThrow();

    await expect(
      LotModel.create({
        ...validLotInput(),
        targetBatchGrams: -100,
      })
    ).rejects.toThrow();
  });

  it('rejects a lot number less than or equal to zero', async () => {
    await expect(
      LotModel.create({
        ...validLotInput(),
        lotNumber: 0,
      })
    ).rejects.toThrow();

    await expect(
      LotModel.create({
        ...validLotInput(),
        lotNumber: -1,
      })
    ).rejects.toThrow();
  });

  it('rejects duplicate lot number for the same formula', async () => {
    await LotModel.create(validLotInput());

    await expect(
      LotModel.create({
        ...validLotInput(),
        lotCode: 'CF-001-L001-DUPLICATE',
      })
    ).rejects.toThrow();
  });

  it('allows the same lot number for different formulas', async () => {
    const otherFormula = await FormulaModel.create({
      productName: 'Aceite de calendula',
      formulaCode: 'CF-002',
      formulaCreatedAt: new Date('2026-02-01'),
      formulaVersion: '1.0',
      productObjectives: ['calmante'],
      productType: 'aceite',
      status: 'validated',
      targetBatchGrams: 250,
      procedureSteps: [{ stepNumber: 1, instruction: 'Mezclar' }],
    });

    await LotModel.create(validLotInput());

    await expect(
      LotModel.create({
        ...validLotInput(),
        formulaId: otherFormula._id.toString(),
        formulaCode: 'CF-002',
        lotCode: 'CF-002-L001',
      })
    ).resolves.toBeDefined();
  });

  it('rejects snapshot ingredients with grams less than or equal to zero', async () => {
    await expect(
      LotModel.create({
        ...validLotInput(),
        formulaSnapshot: {
          ...validLotInput().formulaSnapshot,
          phases: {
            aqueous: [{ ingredient: 'Agua destilada', grams: 0 }],
          },
        },
      })
    ).rejects.toThrow();
  });

  it('initializes follow-up entries to empty array by default', async () => {
    const lot = await LotModel.create(validLotInput());

    expect(lot.followUp.entries).toEqual([]);
  });

  it('persists follow-up entries when provided', async () => {
    const lot = await LotModel.create({
      ...validLotInput(),
      followUp: {
        entries: [
          { date: new Date('2026-03-01'), note: 'Inicio de mezcla' },
          { date: new Date('2026-03-02'), note: 'Control de pH' },
        ],
      },
    });

    expect(lot.followUp.entries).toHaveLength(2);
    expect(lot.followUp.entries[0].note).toBe('Inicio de mezcla');
    expect(lot.followUp.entries[1].note).toBe('Control de pH');
  });

  it('enforces only one composite index per formula and lotNumber', async () => {
    const indexes = LotModel.schema.indexes();
    const composite = indexes.filter(
      ([fields]: [Record<string, unknown>, unknown]) =>
        JSON.stringify(fields) === JSON.stringify({ formulaId: 1, lotNumber: 1 })
    );

    expect(composite).toHaveLength(1);
  });

  it('adds createdAt and updatedAt timestamps', async () => {
    const lot = await LotModel.create(validLotInput());

    expect(lot.createdAt).toBeInstanceOf(Date);
    expect(lot.updatedAt).toBeInstanceOf(Date);
  });
});

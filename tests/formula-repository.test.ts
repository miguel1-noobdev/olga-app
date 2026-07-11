import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createFormulaRepository } from '@/lib/db/repository/formula';
import { createLotRepository } from '@/lib/db/repository/lot';
import { FormulaModel } from '@/lib/db/models/formula';
import { FormulaHasLotsError } from '@/lib/db/errors';

describe('FormulaRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createFormulaRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await FormulaModel.syncIndexes();
    repo = createFormulaRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function lavenderCreamInput() {
    return {
      productName: 'Crema de lavanda',
      formulaCode: 'CF-001',
      formulaCreatedAt: new Date('2026-01-15'),
      formulaVersion: '1.0',
      productObjectives: ['hidratante', 'calmante'],
      productType: 'crema',
      status: 'validated' as const,
      targetBatchGrams: 500,
      phases: {
        aqueous: [{ ingredient: 'Agua destilada', grams: 300 }],
        oil: [{ ingredient: 'Aceite de almendras', grams: 150 }],
        actives: [{ ingredient: 'Extracto de lavanda', grams: 50 }],
      },
      procedureSteps: [
        { stepNumber: 1, instruction: 'Calentar fase acuosa' },
        { stepNumber: 2, instruction: 'Mezclar fase oleosa' },
      ],
      technicalData: {
        finalPh: 5.5,
        productionTemperatureCelsius: 65,
        mixingTimeMinutes: 30,
        preservative: 'Cosgard',
      },
      productEvaluation: {
        texture: 'cremosa',
        smell: 'lavanda',
      },
      useTest: {
        approxExpirationDate: new Date('2026-07-15'),
        entries: [{ date: new Date('2026-01-20'), note: 'Primera impresión' }],
      },
      inci: {
        function: 'emoliente',
        emulsionType: 'o/w',
      },
      finalObservations: 'Primera versión.',
    };
  }

  describe('create', () => {
    it('creates a formula with an id and iso dates', async () => {
      const formula = await repo.create(lavenderCreamInput());

      expect(formula.id).toBeDefined();
      expect(formula.productName).toBe('Crema de lavanda');
      expect(formula.formulaCode).toBe('CF-001');
      expect(formula.formulaVersion).toBe('1.0');
      expect(typeof formula.formulaCreatedAt).toBe('string');
      expect(typeof formula.createdAt).toBe('string');
      expect(formula.status).toBe('validated');
    });

    it('preserves nested recipe and evaluation blocks', async () => {
      const formula = await repo.create(lavenderCreamInput());

      expect(formula.phases?.aqueous).toHaveLength(1);
      expect(formula.phases?.aqueous?.[0].grams).toBe(300);
      expect(formula.technicalData?.finalPh).toBe(5.5);
      expect(formula.productEvaluation?.texture).toBe('cremosa');
      expect(formula.useTest?.entries).toHaveLength(1);
      expect(formula.inci?.function).toBe('emoliente');
    });

    it('rejects duplicate formulaCode', async () => {
      await repo.create(lavenderCreamInput());

      await expect(repo.create(lavenderCreamInput())).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('returns the formula when found', async () => {
      const created = await repo.create(lavenderCreamInput());
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.productName).toBe('Crema de lavanda');
    });

    it('returns null when not found', async () => {
      const found = await repo.findById('000000000000000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findByFormulaCode', () => {
    it('returns the formula by code', async () => {
      await repo.create(lavenderCreamInput());
      const found = await repo.findByFormulaCode('CF-001');

      expect(found).not.toBeNull();
      expect(found?.productName).toBe('Crema de lavanda');
    });

    it('is case-insensitive and trims whitespace', async () => {
      await repo.create(lavenderCreamInput());
      const found = await repo.findByFormulaCode('  cf-001  ');

      expect(found).not.toBeNull();
      expect(found?.formulaCode).toBe('CF-001');
    });

    it('returns null when no formula matches', async () => {
      const found = await repo.findByFormulaCode('CF-999');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all formulas sorted by productName', async () => {
      await repo.create(lavenderCreamInput());
      await repo.create({
        ...lavenderCreamInput(),
        productName: 'Aceite de caléndula',
        formulaCode: 'CF-002',
        formulaVersion: '1.0',
      });

      const all = await repo.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].productName).toBe('Aceite de caléndula');
      expect(all[1].productName).toBe('Crema de lavanda');
    });

    it('returns empty array when no formulas exist', async () => {
      const all = await repo.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('returns formulas matching the status', async () => {
      await repo.create({
        ...lavenderCreamInput(),
        status: 'draft',
      });
      await repo.create({
        ...lavenderCreamInput(),
        productName: 'Aceite de caléndula',
        formulaCode: 'CF-002',
        status: 'validated',
      });

      const result = await repo.findByStatus('validated');

      expect(result).toHaveLength(1);
      expect(result[0].productName).toBe('Aceite de caléndula');
    });

    it('returns empty array when status has no formulas', async () => {
      await repo.create(lavenderCreamInput());

      const result = await repo.findByStatus('archived');

      expect(result).toEqual([]);
    });
  });

  describe('searchByProductName', () => {
    it('finds formulas by productName case-insensitively', async () => {
      await repo.create(lavenderCreamInput());

      const result = await repo.searchByProductName('LAVANDA');

      expect(result).toHaveLength(1);
      expect(result[0].productName).toBe('Crema de lavanda');
    });

    it('returns empty array when nothing matches', async () => {
      await repo.create(lavenderCreamInput());

      const result = await repo.searchByProductName('romero');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates top-level fields', async () => {
      const created = await repo.create(lavenderCreamInput());
      const updated = await repo.update(created.id, {
        productName: 'Crema de lavanda intensa',
        formulaVersion: '1.1',
      });

      expect(updated.productName).toBe('Crema de lavanda intensa');
      expect(updated.formulaVersion).toBe('1.1');
      expect(updated.formulaCode).toBe('CF-001');
    });

    it('throws when formula is not found', async () => {
      await expect(
        repo.update('000000000000000000000000', { productName: 'X' })
      ).rejects.toThrow(/not found/);
    });

    it('rejects invalid targetBatchGrams', async () => {
      const created = await repo.create(lavenderCreamInput());

      await expect(
        repo.update(created.id, { targetBatchGrams: 0 })
      ).rejects.toThrow();
    });

    it('rejects an invalid status value', async () => {
      const created = await repo.create(lavenderCreamInput());

      await expect(
        repo.update(created.id, {
          status: 'invalid-status' as unknown as 'draft',
        })
      ).rejects.toThrow();
    });

    it('normalizes procedure steps on update', async () => {
      const created = await repo.create(lavenderCreamInput());

      const updated = await repo.update(created.id, {
        procedureSteps: [
          { stepNumber: 3, instruction: 'Empaque' },
          { stepNumber: 1, instruction: 'Calentar' },
        ],
      });

      expect(updated.procedureSteps).toHaveLength(2);
      expect(updated.procedureSteps[0].stepNumber).toBe(1);
      expect(updated.procedureSteps[1].stepNumber).toBe(3);
    });

    it('rejects procedure steps with duplicate stepNumber on update', async () => {
      const created = await repo.create(lavenderCreamInput());

      await expect(
        repo.update(created.id, {
          procedureSteps: [
            { stepNumber: 1, instruction: 'Paso uno' },
            { stepNumber: 1, instruction: 'Paso repetido' },
          ],
        })
      ).rejects.toThrow();
    });

    it('rejects ingredients with non-positive grams on update', async () => {
      const created = await repo.create(lavenderCreamInput());

      await expect(
        repo.update(created.id, {
          phases: {
            aqueous: [{ ingredient: 'Agua destilada', grams: 0 }],
          },
        })
      ).rejects.toThrow();
    });

    it('clears optional rich blocks when updated with empty values', async () => {
      const created = await repo.create(lavenderCreamInput());

      const updated = await repo.update(created.id, {
        productObjectives: [],
        technicalData: {},
        productEvaluation: {},
        useTest: {},
        inci: {},
        finalObservations: '',
      });

      expect(updated.productObjectives).toEqual([]);
      expect(updated.technicalData).toBeUndefined();
      expect(updated.productEvaluation).toBeUndefined();
      expect(updated.useTest).toBeUndefined();
      expect(updated.inci).toBeUndefined();
      expect(updated.finalObservations).toBe('');
    });

    it('clears individual nested fields when updated with undefined values', async () => {
      const created = await repo.create(lavenderCreamInput());

      const updated = await repo.update(created.id, {
        technicalData: {
          finalPh: 5.5,
          preservative: undefined,
          fragrance: undefined,
          color: undefined,
          productionTemperatureCelsius: undefined,
          mixingTimeMinutes: undefined,
        },
      });

      expect(updated.technicalData).toEqual({ finalPh: 5.5 });
    });
  });

  describe('delete', () => {
    it('removes the formula', async () => {
      const created = await repo.create(lavenderCreamInput());
      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it('throws when formula is not found', async () => {
      await expect(repo.delete('000000000000000000000000')).rejects.toThrow(/not found/);
    });

    it('rejects deletion when the formula has related lots', async () => {
      const created = await repo.create(lavenderCreamInput());
      const lotRepo = createLotRepository();
      await lotRepo.create({ formulaId: created.id, targetBatchGrams: 500 });

      await expect(repo.delete(created.id)).rejects.toThrow(FormulaHasLotsError);

      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
    });

    it('rejects deletion when the formula has multiple related lots', async () => {
      const created = await repo.create(lavenderCreamInput());
      const lotRepo = createLotRepository();
      await lotRepo.create({ formulaId: created.id, targetBatchGrams: 500 });
      await lotRepo.create({ formulaId: created.id, targetBatchGrams: 1000 });

      await expect(repo.delete(created.id)).rejects.toThrow(FormulaHasLotsError);

      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
    });

    it('allows deletion after all related lots are removed', async () => {
      const created = await repo.create(lavenderCreamInput());
      const lotRepo = createLotRepository();
      const lot = await lotRepo.create({ formulaId: created.id, targetBatchGrams: 500 });
      await lotRepo.delete(lot.id);

      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });
  });
});

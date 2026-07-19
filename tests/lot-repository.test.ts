import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  createLotRepository,
  LotLifecycleError,
  LotValidationError,
} from '@/lib/db/repository/lot';
import { LotModel } from '@/lib/db/models/lot';
import { FormulaModel } from '@/lib/db/models/formula';

describe('LotRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createLotRepository>;
  let formulaId: string;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
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
        mixingTimeMinutes: 20,
        preservative: 'Cosgard',
        fragrance: 'Lavender',
        color: 'Cream',
      },
    });

    formulaId = formula._id.toString();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('create', () => {
    it('creates lot 1 for a formula and copies the snapshot', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      expect(lot.id).toBeDefined();
      expect(lot.lotNumber).toBe(1);
      expect(lot.lotCode).toBe('CF-001-L001');
      expect(lot.formulaId).toBe(formulaId);
      expect(lot.formulaCode).toBe('CF-001');
      expect(lot.formulaVersion).toBe('1.0');
      expect(lot.status).toBe('in_production');
      expect(lot.formulaSnapshot.productName).toBe('Crema de lavanda');
      expect(lot.formulaSnapshot.productType).toBe('crema');
      expect(lot.formulaSnapshot.targetBatchGrams).toBe(500);
      expect(lot.formulaSnapshot.phases?.aqueous).toHaveLength(1);
      expect(lot.formulaSnapshot.procedureSteps).toHaveLength(2);
    });

    it('initializes the start date when creating a lot', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      expect(lot.startedAt).not.toBeNull();
      expect(new Date(lot.startedAt as string).getTime()).toBeGreaterThan(0);
    });

    it('increments lot number per formula', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500 });
      const lot2 = await repo.create({ formulaId, targetBatchGrams: 500 });

      expect(lot2.lotNumber).toBe(2);
      expect(lot2.lotCode).toBe('CF-001-L002');
    });

    it('starts lot numbering at 1 independently for each formula', async () => {
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

      await repo.create({ formulaId, targetBatchGrams: 500 });
      const otherLot = await repo.create({
        formulaId: otherFormula._id.toString(),
        targetBatchGrams: 250,
      });

      expect(otherLot.lotNumber).toBe(1);
      expect(otherLot.lotCode).toBe('CF-002-L001');
    });

    it('throws when the formula does not exist', async () => {
      await expect(
        repo.create({ formulaId: '000000000000000000000000', targetBatchGrams: 500 })
      ).rejects.toThrow(/formula not found/i);
    });

    it('throws when targetBatchGrams is not positive', async () => {
      await expect(
        repo.create({ formulaId, targetBatchGrams: 0 })
      ).rejects.toThrow();

      await expect(
        repo.create({ formulaId, targetBatchGrams: -100 })
      ).rejects.toThrow();
    });

    it('throws when formula status is not validated', async () => {
      const disallowedStatuses = ['draft', 'testing', 'archived', 'discarded'] as const;

      for (const status of disallowedStatuses) {
        const invalidFormula = await FormulaModel.create({
          productName: 'Formula no validada',
          formulaCode: `CF-${status.toUpperCase()}`,
          formulaCreatedAt: new Date('2026-01-15'),
          formulaVersion: '1.0',
          productObjectives: ['test'],
          productType: 'crema',
          status,
          targetBatchGrams: 500,
          procedureSteps: [{ stepNumber: 1, instruction: 'Mezclar' }],
        });

        await expect(
          repo.create({ formulaId: invalidFormula._id.toString(), targetBatchGrams: 500 })
        ).rejects.toThrow(/formula must be validated before creating lots/i);
      }
    });

    it('accepts an explicit canonical initial status', async () => {
      const lot = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'discarded',
      });

      expect(lot.status).toBe('discarded');
    });

    it('rejects legacy statuses from repository creation inputs', async () => {
      await expect(
        repo.create({
          formulaId,
          targetBatchGrams: 500,
          status: 'planned' as unknown as 'in_production',
        })
      ).rejects.toThrow(/estado de lote no válido/i);
    });

    it('accepts operational observations and follow-up entries', async () => {
      const lot = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        operationalObservations: 'Usar agua destilada fresca',
        followUp: {
          entries: [{ date: new Date('2026-03-01'), note: 'Inicio' }],
        },
      });

      expect(lot.operationalObservations).toBe('Usar agua destilada fresca');
      expect(lot.followUp.entries).toHaveLength(1);
    });

    it('scales snapshot ingredient grams to the lot targetBatchGrams', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 1000 });

      expect(lot.targetBatchGrams).toBe(1000);
      expect(lot.formulaSnapshot.targetBatchGrams).toBe(1000);
      expect(lot.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(600);
      expect(lot.formulaSnapshot.phases?.oil?.[0].grams).toBe(300);
      expect(lot.formulaSnapshot.phases?.actives?.[0].grams).toBe(100);
    });

    it('rounds scaled grams to two decimals', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 333 });

      expect(lot.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(199.8);
      expect(lot.formulaSnapshot.phases?.oil?.[0].grams).toBe(99.9);
    });

    it('assigns sequential lot numbers under concurrent creates for the same formula', async () => {
      const inputs = Array.from({ length: 5 }, () => ({
        formulaId,
        targetBatchGrams: 500,
      }));

      const lots = await Promise.all(inputs.map((input) => repo.create(input)));
      const numbers = lots.map((lot) => lot.lotNumber).sort((a, b) => a - b);

      expect(numbers).toEqual([1, 2, 3, 4, 5]);
      expect(new Set(lots.map((lot) => lot.lotCode)).size).toBe(5);
    });

    it('freezes production technical data from the formula into the snapshot', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      expect(lot.formulaSnapshot.technicalData?.productionTemperatureCelsius).toBe(65);
      expect(lot.formulaSnapshot.technicalData?.mixingTimeMinutes).toBe(20);
      expect(lot.formulaSnapshot.technicalData?.preservative).toBe('Cosgard');
    });

    it('does not freeze finalPh, fragrance, or color into the snapshot', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      expect(lot.formulaSnapshot.technicalData).toEqual({
        productionTemperatureCelsius: 65,
        mixingTimeMinutes: 20,
        preservative: 'Cosgard',
      });
    });

    it('keeps snapshot technical data independent from later formula changes', async () => {
      const lot = await repo.create({ formulaId, targetBatchGrams: 500 });

      await FormulaModel.findByIdAndUpdate(formulaId, {
        $set: {
          'technicalData.productionTemperatureCelsius': 80,
          'technicalData.mixingTimeMinutes': 45,
          'technicalData.preservative': 'Geogard',
        },
      });

      const found = await repo.findById(lot.id);

      expect(found?.formulaSnapshot.technicalData?.productionTemperatureCelsius).toBe(65);
      expect(found?.formulaSnapshot.technicalData?.mixingTimeMinutes).toBe(20);
      expect(found?.formulaSnapshot.technicalData?.preservative).toBe('Cosgard');
    });

    it('preserves technical data when scaling targetBatchGrams', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });
      const updated = await repo.update(created.id, { targetBatchGrams: 1000 });

      expect(updated.formulaSnapshot.technicalData?.productionTemperatureCelsius).toBe(65);
      expect(updated.formulaSnapshot.technicalData?.mixingTimeMinutes).toBe(20);
      expect(updated.formulaSnapshot.technicalData?.preservative).toBe('Cosgard');
    });
  });

  describe('findById', () => {
    it('returns the lot when found', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.lotCode).toBe('CF-001-L001');
    });

    it('returns null when not found', async () => {
      const found = await repo.findById('000000000000000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findByLotCode', () => {
    it('returns the lot by code', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500 });
      const found = await repo.findByLotCode('CF-001-L001');

      expect(found).not.toBeNull();
      expect(found?.formulaCode).toBe('CF-001');
    });

    it('is case-insensitive and trims whitespace', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500 });
      const found = await repo.findByLotCode('  cf-001-l001  ');

      expect(found).not.toBeNull();
      expect(found?.lotCode).toBe('CF-001-L001');
    });

    it('returns null when no lot matches', async () => {
      const found = await repo.findByLotCode('CF-999-L001');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all lots sorted by lotCode', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500 });
      await repo.create({ formulaId, targetBatchGrams: 500 });

      const all = await repo.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].lotCode).toBe('CF-001-L001');
      expect(all[1].lotCode).toBe('CF-001-L002');
    });

    it('returns empty array when no lots exist', async () => {
      const all = await repo.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('findByFormulaId', () => {
    it('returns lots for a specific formula', async () => {
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

      await repo.create({ formulaId, targetBatchGrams: 500 });
      await repo.create({ formulaId, targetBatchGrams: 500 });
      await repo.create({
        formulaId: otherFormula._id.toString(),
        targetBatchGrams: 250,
      });

      const result = await repo.findByFormulaId(formulaId);

      expect(result).toHaveLength(2);
      expect(result.every((lot) => lot.formulaId === formulaId)).toBe(true);
    });

    it('returns empty array when formula has no lots', async () => {
      const result = await repo.findByFormulaId(formulaId);

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('returns lots matching the status', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500, status: 'finalized' });
      await repo.create({ formulaId, targetBatchGrams: 500, status: 'in_production' });

      const result = await repo.findByStatus('finalized');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('finalized');
    });

    it('returns empty array when status has no lots', async () => {
      await repo.create({ formulaId, targetBatchGrams: 500 });

      const result = await repo.findByStatus('discarded');

      expect(result).toEqual([]);
    });

    it('finds legacy stored records through their canonical status and normalizes the result', async () => {
      await LotModel.create({
        formulaId,
        formulaCode: 'CF-001',
        formulaVersion: '1.0',
        lotNumber: 1,
        lotCode: 'CF-001-L001',
        status: 'completed',
        targetBatchGrams: 500,
        formulaSnapshot: {
          productName: 'Crema de lavanda',
          productType: 'crema',
          targetBatchGrams: 500,
          procedureSteps: [],
        },
      });

      await expect(repo.findByStatus('finalized')).resolves.toEqual([
        expect.objectContaining({ status: 'finalized' }),
      ]);
    });
  });

  describe('update', () => {
    it('updates status and operational observations', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });
      const updated = await repo.update(created.id, {
        status: 'finalized',
        operationalObservations: 'En mezcla',
      });

      expect(updated.status).toBe('finalized');
      expect(updated.operationalObservations).toBe('En mezcla');
      expect(updated.lotCode).toBe('CF-001-L001');
    });

    it('rejects legacy statuses from repository update inputs', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });

      await expect(
        repo.update(created.id, { status: 'completed' as unknown as 'finalized' })
      ).rejects.toThrow(/estado de lote no válido/i);
    });

    it('appends follow-up entries without losing existing ones', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        followUp: {
          entries: [{ date: new Date('2026-03-01'), note: 'Inicio' }],
        },
      });

      const updated = await repo.update(created.id, {
        followUp: {
          entries: [{ date: new Date('2026-03-02'), note: 'Seguimiento' }],
        },
      });

      expect(updated.followUp.entries).toHaveLength(2);
      expect(updated.followUp.entries[0].note).toBe('Inicio');
      expect(updated.followUp.entries[1].note).toBe('Seguimiento');
    });

    it('recalculates snapshot grams when targetBatchGrams changes', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });
      const updated = await repo.update(created.id, { targetBatchGrams: 250 });

      expect(updated.targetBatchGrams).toBe(250);
      expect(updated.formulaSnapshot.targetBatchGrams).toBe(250);
      expect(updated.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(150);
      expect(updated.formulaSnapshot.phases?.oil?.[0].grams).toBe(75);
      expect(updated.formulaSnapshot.phases?.actives?.[0].grams).toBe(25);
    });

    it('keeps snapshot independent from later formula changes when scaling targetBatchGrams', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });

      await FormulaModel.findByIdAndUpdate(formulaId, {
        $set: {
          'phases.aqueous.0.grams': 999,
          targetBatchGrams: 999,
        },
      });

      const updated = await repo.update(created.id, { targetBatchGrams: 1000 });

      expect(updated.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(600);
      expect(updated.formulaSnapshot.targetBatchGrams).toBe(1000);
    });

    it('regenerates only an in-production lot snapshot from its own provenance', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'in_production',
      });

      await FormulaModel.findByIdAndUpdate(formulaId, {
        $set: {
          'phases.aqueous.0.grams': 999,
          targetBatchGrams: 999,
        },
      });

      const updated = await repo.update(created.id, { targetBatchGrams: 1000 });

      expect(updated.targetBatchGrams).toBe(1000);
      expect(updated.formulaSnapshot.targetBatchGrams).toBe(1000);
      expect(updated.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(600);
    });

    it('rescales an in-production lot snapshot', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'in_production',
      });

      await expect(repo.update(created.id, { targetBatchGrams: 1000 })).resolves.toEqual(
        expect.objectContaining({ targetBatchGrams: 1000 })
      );
    });

    it('rejects finalized production mutations while preserving its snapshot', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'finalized',
        operationalObservations: 'Final production note',
      });

      await expect(
        repo.update(created.id, {
          targetBatchGrams: 1000,
          operationalObservations: 'Changed production note',
        })
      ).rejects.toEqual(
        expect.objectContaining<Partial<LotLifecycleError>>({ reason: 'completed_freeze' })
      );

      const stored = await repo.findById(created.id);

      expect(stored?.targetBatchGrams).toBe(500);
      expect(stored?.formulaSnapshot.targetBatchGrams).toBe(500);
      expect(stored?.formulaSnapshot.phases?.aqueous?.[0].grams).toBe(300);
      expect(stored?.operationalObservations).toBe('Final production note');
    });

    it('allows dated append-only follow-up for a finalized historical lot', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'finalized',
        followUp: {
          entries: [{ date: new Date('2026-03-01'), note: 'Initial follow-up' }],
        },
      });

      const updated = await repo.update(created.id, {
        followUp: {
          entries: [{ date: new Date('2026-03-02'), note: 'Completed follow-up' }],
        },
      });

      expect(updated.followUp.entries).toEqual([
        expect.objectContaining({ note: 'Initial follow-up' }),
        expect.objectContaining({ note: 'Completed follow-up' }),
      ]);
      expect(updated.formulaSnapshot.targetBatchGrams).toBe(500);
    });

    it('rejects discarded production mutations while preserving its snapshot', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'discarded',
      });

      await expect(repo.update(created.id, {
        status: 'in_production',
        operationalObservations: 'Reopened for review',
        plannedAt: new Date('2026-04-01'),
      })).rejects.toEqual(
        expect.objectContaining<Partial<LotLifecycleError>>({ reason: 'completed_freeze' })
      );

      const stored = await repo.findById(created.id);
      expect(stored).toEqual(expect.objectContaining({ status: 'discarded', targetBatchGrams: 500 }));
      expect(stored?.operationalObservations).toBeUndefined();
    });

    it('rejects snapshot regeneration for a discarded lot', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'discarded',
      });

      await expect(repo.update(created.id, { targetBatchGrams: 1000 })).rejects.toEqual(
        expect.objectContaining<Partial<LotLifecycleError>>({ reason: 'completed_freeze' })
      );
    });

    it('keeps lifecycle guards when a recovered repository instance is created', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'finalized',
        operationalObservations: 'Immutable production record',
      });
      const recoveredRepository = createLotRepository();

      await expect(
        recoveredRepository.update(created.id, {
          targetBatchGrams: 1000,
          operationalObservations: 'Unsafe recovered mutation',
        })
      ).rejects.toEqual(
        expect.objectContaining<Partial<LotLifecycleError>>({ reason: 'completed_freeze' })
      );

      const stored = await recoveredRepository.findById(created.id);
      expect(stored).toEqual(
        expect.objectContaining({
          status: 'finalized',
          targetBatchGrams: 500,
          operationalObservations: 'Immutable production record',
        })
      );
      expect(stored?.formulaSnapshot.targetBatchGrams).toBe(500);
    });

    it('rejects a production update when the lot completes after its lifecycle read', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        status: 'in_production',
      });
      const originalFindOneAndUpdate = LotModel.findOneAndUpdate.bind(LotModel);

      type FindOneAndUpdateCall = (
        ...args: Parameters<typeof originalFindOneAndUpdate>
      ) => Promise<Awaited<ReturnType<typeof originalFindOneAndUpdate>>>;
      const findOneAndUpdateSpy = vi.spyOn(LotModel, 'findOneAndUpdate') as unknown as {
        mockImplementationOnce(implementation: FindOneAndUpdateCall): void;
      };

      findOneAndUpdateSpy.mockImplementationOnce(async (...args) => {
        await originalFindOneAndUpdate({ _id: created.id }, { $set: { status: 'finalized' } });
        return originalFindOneAndUpdate(...args);
      });

      await expect(repo.update(created.id, { targetBatchGrams: 1000 })).rejects.toEqual(
        expect.objectContaining<Partial<LotLifecycleError>>({ reason: 'completed_freeze' })
      );

      const stored = await repo.findById(created.id);
      expect(stored?.status).toBe('finalized');
      expect(stored?.targetBatchGrams).toBe(500);
      expect(stored?.formulaSnapshot.targetBatchGrams).toBe(500);
    });

    it('rejects non-positive targetBatchGrams on update', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });

      await expect(repo.update(created.id, { targetBatchGrams: 0 })).rejects.toEqual(
        expect.objectContaining<Partial<LotValidationError>>({
          reason: 'target_batch_grams_invalid',
        })
      );
      await expect(repo.update(created.id, { targetBatchGrams: -100 })).rejects.toEqual(
        expect.objectContaining<Partial<LotValidationError>>({
          reason: 'target_batch_grams_invalid',
        })
      );
    });

    it('throws when lot is not found', async () => {
      await expect(
        repo.update('000000000000000000000000', { status: 'finalized' })
      ).rejects.toThrow(/not found/);
    });

    it('rejects an invalid status value', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });

      await expect(
        repo.update(created.id, {
          status: 'invalid-status' as unknown as 'in_production',
        })
      ).rejects.toThrow();
    });

    it('appends follow-up entries atomically under concurrent updates', async () => {
      const created = await repo.create({
        formulaId,
        targetBatchGrams: 500,
        followUp: {
          entries: [{ date: new Date('2026-03-01'), note: 'Inicio' }],
        },
      });

      await Promise.all([
        repo.update(created.id, {
          followUp: {
            entries: [{ date: new Date('2026-03-02'), note: 'Seguimiento A' }],
          },
        }),
        repo.update(created.id, {
          followUp: {
            entries: [{ date: new Date('2026-03-03'), note: 'Seguimiento B' }],
          },
        }),
      ]);

      const fromDb = await repo.findById(created.id);

      expect(fromDb!.followUp.entries).toHaveLength(3);

      const notes = fromDb!.followUp.entries.map((entry) => entry.note);
      expect(notes).toContain('Inicio');
      expect(notes).toContain('Seguimiento A');
      expect(notes).toContain('Seguimiento B');
    });
  });

  describe('delete', () => {
    it('removes the lot', async () => {
      const created = await repo.create({ formulaId, targetBatchGrams: 500 });
      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it('throws when lot is not found', async () => {
      await expect(repo.delete('000000000000000000000000')).rejects.toThrow(/not found/);
    });
  });
});

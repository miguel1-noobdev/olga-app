import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const legacyStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
type LegacyLot = { _id: mongoose.Types.ObjectId; status: string; [key: string]: unknown };

describe('submitLotEditUpdate status persistence', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    mongoose.deleteModel(/Lot/);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    mongoose.deleteModel(/Lot/);
    vi.resetModules();
    vi.doUnmock('next/navigation');
    vi.doUnmock('@/lib/db/connect');
  });

  it.each(['in_production', 'finalized', 'discarded'] as const)(
    'persists canonical status %s through the edit server action after a legacy model is cached',
    async (status) => {
      const LegacyLotModel = mongoose.model<LegacyLot>(
        'Lot',
        new mongoose.Schema<LegacyLot>(
          {
            status: { type: String, enum: legacyStatuses, required: true },
          },
          { strict: false, timestamps: true }
        )
      );

      const lot = await LegacyLotModel.create({
        formulaId: new mongoose.Types.ObjectId(),
        formulaCode: 'CF-001',
        formulaVersion: '1.0',
        lotNumber: 1,
        lotCode: 'CF-001-L001',
        status: 'planned',
        targetBatchGrams: 500,
        formulaSnapshot: {
          productName: 'Crema de lavanda',
          productType: 'crema',
          targetBatchGrams: 500,
          procedureSteps: [],
        },
        followUp: { entries: [] },
      });

      vi.resetModules();
      vi.doMock('next/navigation', () => ({
        redirect: (path: string) => {
          throw new Error(`NEXT_REDIRECT ${path}`);
        },
      }));
      vi.doMock('@/lib/auth/current-user', () => ({
        getCurrentUser: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'productora' }),
      }));
      vi.doMock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));

      const { submitLotEditUpdate } = await import(
        '@/app/laboratorio/lotes/[lotId]/editar/actions'
      );

      await expect(
        submitLotEditUpdate(lot._id.toString(), {
          status,
          targetBatchGrams: '',
          plannedAt: '',
          startedAt: '',
          completedAt: '',
          operationalObservations: '',
        })
      ).resolves.toEqual({
        success: true,
        redirectTo: `/laboratorio/lotes/${lot._id}`,
      });

      const { LotModel } = await import('@/lib/db/models/lot');
      expect((await LotModel.findById(lot._id))?.status).toBe(status);
    }
  );

  it('rejects an invalid status before mutating the persisted lot', async () => {
    const LegacyLotModel = mongoose.model<LegacyLot>(
      'Lot',
      new mongoose.Schema<LegacyLot>(
        {
          status: { type: String, enum: legacyStatuses, required: true },
        },
        { strict: false, timestamps: true }
      )
    );
    const lot = await LegacyLotModel.create({ status: 'planned' });

    vi.resetModules();
    vi.doMock('next/navigation', () => ({ redirect: vi.fn() }));
    vi.doMock('@/lib/auth/current-user', () => ({
      getCurrentUser: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'productora' }),
    }));
    vi.doMock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));

    const { submitLotEditUpdate } = await import(
      '@/app/laboratorio/lotes/[lotId]/editar/actions'
    );

    await expect(
      submitLotEditUpdate(lot._id.toString(), {
        status: 'invalid-status' as never,
        targetBatchGrams: '',
        plannedAt: '',
        startedAt: '',
        completedAt: '',
        operationalObservations: '',
      })
    ).resolves.toEqual({ success: false, errors: { status: 'El estado es obligatorio' } });

    expect((await LegacyLotModel.findById(lot._id))?.status).toBe('planned');
  });
});

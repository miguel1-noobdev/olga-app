import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitNewLot } from '@/app/laboratorio/lotes/nuevo/actions';
import { submitLotFollowUp } from '@/app/laboratorio/lotes/[lotId]/actions';
import { submitLotEditUpdate } from '@/app/laboratorio/lotes/[lotId]/editar/actions';

const {
  getCurrentUserMock,
  connectToDatabaseMock,
  formulaFindByIdMock,
  lotCreateMock,
  lotFindByIdMock,
  lotUpdateMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  formulaFindByIdMock: vi.fn(),
  lotCreateMock: vi.fn(),
  lotFindByIdMock: vi.fn(),
  lotUpdateMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({ findById: formulaFindByIdMock })),
}));
vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    create: lotCreateMock,
    findById: lotFindByIdMock,
    update: lotUpdateMock,
  })),
}));

const validFollowUp = { date: '2026-07-19', note: 'Stable texture.' };
const validEdit = {
  status: 'in_production' as const,
  targetBatchGrams: '500',
  plannedAt: '',
  startedAt: '',
  completedAt: '',
  operationalObservations: '',
};

describe('lot mutation server-action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectToDatabaseMock.mockResolvedValue(undefined);
  });

  it.each([
    ['unauthenticated', null],
    ['non-staff', { id: 'reader-1', role: 'suscriptora' }],
  ])('rejects %s lot creation before repository access', async (_label, user) => {
    getCurrentUserMock.mockResolvedValue(user);

    await expect(submitNewLot({ formulaId: 'formula-1', targetBatchGrams: 500 })).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(formulaFindByIdMock).not.toHaveBeenCalled();
    expect(lotCreateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized staff member to create a lot', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    formulaFindByIdMock.mockResolvedValue({ id: 'formula-1', status: 'validated' });
    lotCreateMock.mockResolvedValue({ id: 'lot-1' });

    await expect(submitNewLot({ formulaId: 'formula-1', targetBatchGrams: 500 })).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-1',
    });
  });

  it.each([
    ['unauthenticated', null],
    ['non-staff', { id: 'reader-1', role: 'suscriptora' }],
  ])('rejects %s follow-up before repository access', async (_label, user) => {
    getCurrentUserMock.mockResolvedValue(user);

    await expect(submitLotFollowUp('lot-1', validFollowUp)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(lotUpdateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized admin to append a follow-up', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    lotUpdateMock.mockResolvedValue({ id: 'lot-1' });

    await expect(submitLotFollowUp('lot-1', validFollowUp)).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-1',
    });
  });

  it.each([
    ['unauthenticated', null],
    ['non-staff', { id: 'reader-1', role: 'suscriptora' }],
  ])('rejects %s lot edit before repository access', async (_label, user) => {
    getCurrentUserMock.mockResolvedValue(user);

    await expect(submitLotEditUpdate('lot-1', validEdit)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(lotFindByIdMock).not.toHaveBeenCalled();
    expect(lotUpdateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized productora to edit a lot', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    lotFindByIdMock.mockResolvedValue({ id: 'lot-1', status: 'in_production', targetBatchGrams: 500 });
    lotUpdateMock.mockResolvedValue({ id: 'lot-1' });

    await expect(submitLotEditUpdate('lot-1', validEdit)).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-1',
    });
  });
});

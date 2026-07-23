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

const validFollowUp = { date: '2026-07-19', note: 'Stable texture.', requestId: 'follow-up-request-001' };
const formulaId = '507f1f77bcf86cd799439011';
const lotId = '507f1f77bcf86cd799439012';
const creationRequestId = 'lot-create-request-001';
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

    await expect(submitNewLot({ formulaId, targetBatchGrams: 500, creationRequestId })).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(formulaFindByIdMock).not.toHaveBeenCalled();
    expect(lotCreateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized staff member to create a lot', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    formulaFindByIdMock.mockResolvedValue({ id: formulaId, status: 'validated' });
    lotCreateMock.mockResolvedValue({ id: lotId });

    await expect(submitNewLot({ formulaId, targetBatchGrams: 500, creationRequestId: 'lot-create-request-002' })).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });
  });

  it.each([
    ['unauthenticated', null],
    ['non-staff', { id: 'reader-1', role: 'suscriptora' }],
  ])('rejects %s follow-up before repository access', async (_label, user) => {
    getCurrentUserMock.mockResolvedValue(user);

    await expect(submitLotFollowUp(lotId, validFollowUp)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(lotUpdateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized admin to append a follow-up', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    lotUpdateMock.mockResolvedValue({ id: lotId });

    await expect(submitLotFollowUp(lotId, validFollowUp)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });
  });

  it.each([
    ['unauthenticated', null],
    ['non-staff', { id: 'reader-1', role: 'suscriptora' }],
  ])('rejects %s lot edit before repository access', async (_label, user) => {
    getCurrentUserMock.mockResolvedValue(user);

    await expect(submitLotEditUpdate(lotId, validEdit)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });

    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(lotFindByIdMock).not.toHaveBeenCalled();
    expect(lotUpdateMock).not.toHaveBeenCalled();
  });

  it('allows an authorized productora to edit a lot', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    lotFindByIdMock.mockResolvedValue({ id: lotId, status: 'in_production', targetBatchGrams: 500 });
    lotUpdateMock.mockResolvedValue({ id: lotId });

    await expect(submitLotEditUpdate(lotId, validEdit)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });
  });

  it('contains follow-up connection failures in the result contract', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await submitLotFollowUp(lotId, validFollowUp);

    expect(result).toEqual({ success: false, error: 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
  });

  it('contains lot edit connection failures in the result contract', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await submitLotEditUpdate(lotId, validEdit);

    expect(result).toEqual({ success: false, error: 'No se pudo actualizar el lote. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
  });

  it('contains lot action authentication failures in the result contract', async () => {
    getCurrentUserMock.mockRejectedValue(new Error('CastError: database connection string'));

    const followUpResult = await submitLotFollowUp(lotId, validFollowUp);
    const editResult = await submitLotEditUpdate(lotId, validEdit);

    expect(followUpResult).toEqual({ success: false, error: 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.' });
    expect(editResult).toEqual({ success: false, error: 'No se pudo actualizar el lote. Intentelo de nuevo.' });
    expect(JSON.stringify({ followUpResult, editResult })).not.toContain('connection string');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLotEditUpdate } from '@/app/laboratorio/lotes/[lotId]/editar/actions';
import { createEmptyLotEditFormValues } from '@/lib/lots/lot-edit-form-contract';

const { getCurrentUserMock, connectToDatabaseMock, findByIdMock, updateMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  findByIdMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({ findById: findByIdMock, update: updateMock })),
}));

const lotId = '507f1f77bcf86cd799439011';
const currentLot = { id: lotId, status: 'in_production', targetBatchGrams: 500 };

describe('canonical submitLotEditUpdate server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
    connectToDatabaseMock.mockResolvedValue(undefined);
  });

  function buildValidForm() {
    return {
      ...createEmptyLotEditFormValues(),
      status: 'in_production' as const,
      targetBatchGrams: '500',
      plannedAt: '2026-04-20',
      operationalObservations: 'Use fresh distilled water',
    };
  }

  it('returns the canonical detail destination after a valid update', async () => {
    const values = buildValidForm();
    findByIdMock.mockResolvedValue(currentLot);
    updateMock.mockResolvedValue({ id: lotId });

    await expect(submitLotEditUpdate(lotId, values)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });

    expect(updateMock).toHaveBeenCalledWith(lotId, expect.objectContaining({
      status: 'in_production',
      operationalObservations: 'Use fresh distilled water',
    }));
  });

  it('allows an in-production lot to rescale its snapshot', async () => {
    findByIdMock.mockResolvedValue(currentLot);
    updateMock.mockResolvedValue({ id: lotId });

    await expect(
      submitLotEditUpdate(lotId, { ...buildValidForm(), targetBatchGrams: '750' })
    ).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });
    expect(updateMock).toHaveBeenCalledWith(lotId, expect.objectContaining({
      targetBatchGrams: 750,
    }));
  });

  it('does not touch the database for invalid target batch input', async () => {
    const values = { ...buildValidForm(), targetBatchGrams: '0' };

    await expect(submitLotEditUpdate(lotId, values)).resolves.toEqual({
      success: false,
      errors: { targetBatchGrams: 'El lote objetivo debe ser mayor a 0' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('returns an error when the lot does not exist', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(submitLotEditUpdate(lotId, buildValidForm())).resolves.toEqual({
      success: false,
      error: 'Lote no encontrado',
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns an error when the repository update fails unexpectedly', async () => {
    findByIdMock.mockResolvedValue(currentLot);
    updateMock.mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(submitLotEditUpdate(lotId, buildValidForm())).resolves.toEqual({
      success: false,
      error: 'No se pudo actualizar el lote. Intentelo de nuevo.',
    });
  });

  it('returns an error when the database connection fails unexpectedly', async () => {
    connectToDatabaseMock.mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(submitLotEditUpdate(lotId, buildValidForm())).resolves.toEqual({
      success: false,
      error: 'No se pudo actualizar el lote. Intentelo de nuevo.',
    });
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('rejects malformed lot ids and invalid optional dates before database access', async () => {
    const values = { ...buildValidForm(), startedAt: '2026-02-30' };

    await expect(submitLotEditUpdate(lotId, values)).resolves.toEqual({
      success: false,
      errors: { startedAt: 'La fecha de inicio no es válida' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('returns the canonical detail destination after finalizing a lot', async () => {
    const values = { ...buildValidForm(), status: 'finalized' as const, targetBatchGrams: '500' };
    findByIdMock.mockResolvedValue({ ...currentLot, status: 'in_production' });
    updateMock.mockResolvedValue({ id: lotId });

    await expect(submitLotEditUpdate(lotId, values)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });
    expect(updateMock).toHaveBeenCalledWith(
      lotId,
      expect.objectContaining({ status: 'finalized' })
    );
  });

  it.each(['finalized', 'discarded'] as const)('rejects production edits for a %s lot', async (status) => {
    findByIdMock.mockResolvedValue({ ...currentLot, status });

    await expect(submitLotEditUpdate(lotId, { ...buildValidForm(), operationalObservations: 'Bypass' })).resolves.toEqual({
      success: false,
      error: 'El lote no puede modificarse después de finalizarse o descartarse',
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});

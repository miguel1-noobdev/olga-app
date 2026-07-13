import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLotEditUpdate } from '@/app/laboratorio/lotes/[lotId]/editar/actions';
import { createEmptyLotEditFormValues } from '@/lib/lots/lot-edit-form-contract';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT ${path}`); }),
}));
const { connectToDatabaseMock, findByIdMock, updateMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findByIdMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: redirectMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({ findById: findByIdMock, update: updateMock })),
}));

const currentLot = { id: 'lot-1', status: 'planned', targetBatchGrams: 500 };

describe('canonical submitLotEditUpdate server action', () => {
  beforeEach(() => vi.clearAllMocks());

  function buildValidForm() {
    return {
      ...createEmptyLotEditFormValues(),
      status: 'in_progress' as const,
      targetBatchGrams: '750',
      plannedAt: '2026-04-20',
      operationalObservations: 'Use fresh distilled water',
    };
  }

  it('rescales a planned lot and redirects to canonical detail', async () => {
    const values = buildValidForm();
    findByIdMock.mockResolvedValue(currentLot);
    updateMock.mockResolvedValue({ id: 'lot-1' });

    await expect(submitLotEditUpdate('lot-1', values)).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/lotes/lot-1'
    );

    expect(updateMock).toHaveBeenCalledWith('lot-1', expect.objectContaining({
      targetBatchGrams: 750,
      status: 'in_progress',
      operationalObservations: 'Use fresh distilled water',
    }));
  });

  it('rejects an attempted rescale for an in-progress lot before mutation', async () => {
    findByIdMock.mockResolvedValue({ ...currentLot, status: 'in_progress' });

    await expect(submitLotEditUpdate('lot-1', buildValidForm())).resolves.toEqual({
      success: false,
      error: 'Lot snapshot cannot be rescaled in its current status',
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('does not touch the database for invalid target batch input', async () => {
    const values = { ...buildValidForm(), targetBatchGrams: '0' };

    await expect(submitLotEditUpdate('lot-1', values)).resolves.toEqual({
      success: false,
      errors: { targetBatchGrams: 'Target batch must be greater than 0' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });
});

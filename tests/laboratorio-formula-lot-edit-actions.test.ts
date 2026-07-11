import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLotEditUpdate } from '@/app/laboratorio/formulas/[id]/lotes/[lotId]/edit/actions';
import {
  createEmptyLotEditFormValues,
  toUpdateLotInput,
} from '@/lib/lots/lot-edit-form-contract';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { connectToDatabaseMock, updateMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    update: updateMock,
  })),
}));

describe('submitLotEditUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildValidForm() {
    const form = createEmptyLotEditFormValues();
    form.status = 'in_progress';
    form.plannedAt = '2026-04-20';
    form.startedAt = '2026-04-21';
    form.completedAt = '2026-04-22';
    form.operationalObservations = 'Use fresh distilled water';
    return form;
  }

  it('returns field errors for invalid values without touching the repository', async () => {
    const values = createEmptyLotEditFormValues();
    values.plannedAt = 'not-a-date';

    const result = await submitLotEditUpdate('lot-1', values);

    expect(result).toEqual({
      success: false,
      errors: { plannedAt: 'Planned date is invalid' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('connects to database, updates the lot, and redirects to the lot detail', async () => {
    const lotId = 'lot-1';
    const formulaId = 'formula-1';
    const form = buildValidForm();
    updateMock.mockResolvedValue({
      id: lotId,
      formulaId,
      lotCode: 'CF-001-L001',
    });

    await expect(submitLotEditUpdate(lotId, form)).rejects.toThrow(
      `NEXT_REDIRECT /laboratorio/formulas/${formulaId}/lotes/${lotId}`
    );

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(lotId, toUpdateLotInput(form));
  });

  it('returns a generic error when repository update fails', async () => {
    const lotId = 'lot-1';
    const form = buildValidForm();
    updateMock.mockRejectedValue(new Error('Database write failed'));

    const result = await submitLotEditUpdate(lotId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Database write failed');
  });

  it('returns a generic error when the lot is not found', async () => {
    const lotId = 'missing-lot';
    const form = buildValidForm();
    updateMock.mockRejectedValue(new Error('Lot not found'));

    const result = await submitLotEditUpdate(lotId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Lot not found');
  });
});

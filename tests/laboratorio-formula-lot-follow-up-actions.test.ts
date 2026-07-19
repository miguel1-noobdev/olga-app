import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLotFollowUp } from '@/app/laboratorio/lotes/[lotId]/actions';
import {
  createEmptyLotFollowUpFormValues,
  toLotFollowUpEntry,
} from '@/lib/lots/lot-follow-up-form-contract';

const { getCurrentUserMock, connectToDatabaseMock, updateMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    update: updateMock,
  })),
}));

describe('submitLotFollowUp server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  function buildValidForm() {
    return {
      date: '2026-05-10',
      note: 'Texture is stable.',
    };
  }

  it('returns validation errors without touching the database for empty fields', async () => {
    const form = createEmptyLotFollowUpFormValues();

    const result = await submitLotFollowUp('lot-1', form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.date).toBeDefined();
    expect('errors' in result && result.errors.note).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('connects to database, appends follow-up entry, and returns the lot detail redirect', async () => {
    const lotId = 'lot-1';
    const form = buildValidForm();
    updateMock.mockResolvedValue({
      id: 'lot-1',
      formulaId: 'formula-1',
      lotCode: 'CF-001-L001',
    });

    const result = await submitLotFollowUp(lotId, form);

    expect(result).toEqual({
      success: true,
      redirectTo: `/laboratorio/lotes/${lotId}`,
    });

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(lotId, {
      followUp: { entries: [toLotFollowUpEntry(form)] },
    });
  });

  it('returns a generic error when repository update fails', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValue(new Error('Database write failed'));

    const result = await submitLotFollowUp('lot-1', form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Database write failed');
  });

  it('returns a generic error for non-error rejections', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValue('Unexpected failure');

    const result = await submitLotFollowUp('lot-1', form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe(
      'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.'
    );
  });
});

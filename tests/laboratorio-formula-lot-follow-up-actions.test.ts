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
  const lotId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  function buildValidForm() {
    return {
      date: '2026-05-10',
      note: 'Texture is stable.',
      requestId: 'follow-up-request-001',
    };
  }

  it('returns validation errors without touching the database for empty fields', async () => {
    const form = createEmptyLotFollowUpFormValues();

    const result = await submitLotFollowUp(lotId, form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.date).toBeDefined();
    expect('errors' in result && result.errors.note).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('connects to database, appends follow-up entry, and returns the lot detail redirect', async () => {
    const form = buildValidForm();
    updateMock.mockResolvedValue({
      id: lotId,
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
    updateMock.mockRejectedValueOnce(new Error('Database write failed'));

    const result = await submitLotFollowUp(lotId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.');
    expect('error' in result && result.error).not.toContain('Database write failed');
  });

  it('returns a generic error for non-error rejections', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValueOnce('Unexpected failure');

    const result = await submitLotFollowUp(lotId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe(
      'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.'
    );
  });

  it('rejects malformed lot ids and non-calendar dates before database access', async () => {
    const result = await submitLotFollowUp(lotId, { date: '2026-02-30', note: 'Stable', requestId: 'follow-up-request-001' });

    expect(result).toEqual({ success: false, errors: { date: 'La fecha no es válida' } });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns a stable error when database connection fails', async () => {
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await submitLotFollowUp(lotId, buildValidForm());

    expect(result).toEqual({ success: false, error: 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns a stable error when authentication lookup fails', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error('CastError: database connection string'));

    const result = await submitLotFollowUp(lotId, buildValidForm());

    expect(result).toEqual({ success: false, error: 'No se pudo agregar la entrada de seguimiento. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('connection string');
  });

  it('rejects missing and malformed follow-up request IDs before database access', async () => {
    const missing = await submitLotFollowUp(lotId, { date: '2026-05-10', note: 'Stable' });
    const malformed = await submitLotFollowUp(lotId, {
      date: '2026-05-10',
      note: 'Stable',
      requestId: 'request id with spaces',
    });

    expect(missing).toEqual({ success: false, error: 'Entrada inválida' });
    expect(malformed).toEqual({ success: false, error: 'Entrada inválida' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});

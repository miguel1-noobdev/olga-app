import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLot } from '@/app/laboratorio/formulas/[id]/lotes/nuevo/actions';
import { createEmptyLotForm, toCreateLotInput } from '@/lib/lots/lot-form-contract';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { connectToDatabaseMock, createMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    create: createMock,
  })),
}));

describe('submitLot server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildValidForm(formulaId: string) {
    const form = createEmptyLotForm(formulaId, 500);
    form.targetBatchGrams = 750;
    form.status = 'in_progress';
    form.plannedAt = '2026-04-20';
    form.operationalObservations = 'Use fresh distilled water';
    return form;
  }

  it('returns validation errors without touching the database for empty target batch', async () => {
    const form = createEmptyLotForm('formula-1', 500);
    form.targetBatchGrams = '';

    const result = await submitLot('formula-1', form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.targetBatchGrams).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('connects to database, creates lot, and redirects to the source formula detail', async () => {
    const formulaId = 'formula-1';
    const form = buildValidForm(formulaId);
    createMock.mockResolvedValue({
      id: 'lot-123',
      formulaId,
      lotCode: 'CF-001-L001',
    });

    await expect(submitLot(formulaId, form)).rejects.toThrow(
      `NEXT_REDIRECT /laboratorio/formulas/${formulaId}`
    );

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(toCreateLotInput(form));
  });

  it('returns a generic error when repository create fails', async () => {
    const formulaId = 'formula-1';
    const form = buildValidForm(formulaId);
    createMock.mockRejectedValue(new Error('Database write failed'));

    const result = await submitLot(formulaId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Database write failed');
  });

  it('returns the repository error when lot creation is rejected by the formula status guard', async () => {
    const formulaId = 'formula-1';
    const form = buildValidForm(formulaId);
    createMock.mockRejectedValue(new Error('Formula must be validated before creating lots'));

    const result = await submitLot(formulaId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe(
      'Formula must be validated before creating lots'
    );
  });
});

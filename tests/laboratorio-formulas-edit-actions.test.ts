import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFormulaUpdate } from '@/app/laboratorio/formulas/[id]/edit/actions';
import {
  createEmptyFormulaForm,
  toUpdateFormulaInput,
} from '@/lib/formulas/formula-form-contract';

const { getCurrentUserMock, connectToDatabaseMock, updateMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
    update: updateMock,
  })),
}));

describe('submitFormulaUpdate server action', () => {
  const formulaId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'admin' });
  });

  it('rejects non-staff calls before database access', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', role: 'suscriptora' });

    await expect(submitFormulaUpdate(formulaId, buildValidForm())).resolves.toEqual({ success: false, error: 'No autorizado' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  function buildValidForm() {
    const form = createEmptyFormulaForm();
    form.productName = 'Lavender cream';
    form.formulaCode = 'CF-001';
    form.formulaCreatedAt = '2026-03-10';
    form.formulaVersion = '1.1';
    form.productType = 'cream';
    form.targetBatchGrams = 500;
    form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
    form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
    return form;
  }

  it('returns validation errors without touching the database for an empty form', async () => {
    const form = createEmptyFormulaForm();

    const result = await submitFormulaUpdate(formulaId, form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.productName).toBeDefined();
    expect('errors' in result && result.errors.formulaCode).toBeDefined();
    expect('errors' in result && result.errors.productType).toBeDefined();
    expect('errors' in result && result.errors.targetBatchGrams).toBeDefined();
    expect('errors' in result && result.errors.phases).toBeDefined();
    expect('errors' in result && result.errors.procedureSteps).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('connects to database, updates formula, and returns the detail destination', async () => {
    const form = buildValidForm();
    updateMock.mockResolvedValue({
      id: formulaId,
      productName: form.productName,
    });

    await expect(submitFormulaUpdate(formulaId, form)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/formulas/${formulaId}`,
    });

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(formulaId, toUpdateFormulaInput(form));
  });

  it('returns a generic error when repository update fails', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValueOnce(new Error('Database write failed'));

    const result = await submitFormulaUpdate(formulaId, form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('No se pudo actualizar la fórmula. Inténtelo de nuevo.');
    expect('error' in result && result.error).not.toContain('Database write failed');
  });

  it('returns an error when formula is not found', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValueOnce(new Error('Formula not found'));

    const result = await submitFormulaUpdate('507f1f77bcf86cd799439012', form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('No se pudo actualizar la fórmula. Inténtelo de nuevo.');
  });

  it('returns a stable error when database connection fails', async () => {
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await submitFormulaUpdate(formulaId, buildValidForm());

    expect(result).toEqual({ success: false, error: 'No se pudo actualizar la fórmula. Inténtelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns a stable error when authentication lookup fails', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error('CastError: database connection string'));

    const result = await submitFormulaUpdate(formulaId, buildValidForm());

    expect(result).toEqual({ success: false, error: 'No se pudo actualizar la fórmula. Inténtelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('connection string');
  });

  it('rejects a malformed formula id and invalid nested numbers before database access', async () => {
    const form = buildValidForm();
    form.targetBatchGrams = Number.POSITIVE_INFINITY;

    const result = await submitFormulaUpdate(formulaId, form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.targetBatchGrams).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('passes rich formula blocks to the repository on update', async () => {
    const form = buildValidForm();
    form.productObjectives = [{ value: 'hydrating' }, { value: 'soothing' }];
    form.technicalData = {
      finalPh: 5.5,
      productionTemperatureCelsius: 75,
      mixingTimeMinutes: 20,
      preservative: 'Potassium sorbate',
      fragrance: 'Lavender',
      color: 'White',
    };
    form.productEvaluation = {
      texture: 'Creamy',
      color: 'White',
      smell: 'Lavender',
      viscosity: 'Medium',
      absorption: 'Fast',
      foam: 'None',
      stability: 'Stable',
    };
    form.useTest = {
      approxExpirationDate: '2026-12-01',
      entries: [{ date: '2026-03-15', note: 'Good texture' }],
    };
    form.inci = {
      function: 'Emollient',
      emulsionType: 'O/W',
      dosage: '5%',
      temperature: 'Room',
      compatibility: 'Good',
      inconveniences: 'None',
      ph: '5.5',
    };
    form.finalObservations = 'Updated observations';
    updateMock.mockResolvedValue({
      id: formulaId,
      productName: form.productName,
    });

    await expect(submitFormulaUpdate(formulaId, form)).resolves.toEqual({
      success: true,
      redirectTo: `/laboratorio/formulas/${formulaId}`,
    });

    expect(updateMock).toHaveBeenCalledWith(
      formulaId,
      expect.objectContaining({
        productObjectives: ['hydrating', 'soothing'],
        technicalData: {
          finalPh: 5.5,
          productionTemperatureCelsius: 75,
          mixingTimeMinutes: 20,
          preservative: 'Potassium sorbate',
          fragrance: 'Lavender',
          color: 'White',
        },
        productEvaluation: {
          texture: 'Creamy',
          color: 'White',
          smell: 'Lavender',
          viscosity: 'Medium',
          absorption: 'Fast',
          foam: 'None',
          stability: 'Stable',
        },
        useTest: {
          approxExpirationDate: new Date('2026-12-01'),
          entries: [{ date: new Date('2026-03-15'), note: 'Good texture' }],
        },
        inci: {
          function: 'Emollient',
          emulsionType: 'O/W',
          dosage: '5%',
          temperature: 'Room',
          compatibility: 'Good',
          inconveniences: 'None',
          ph: '5.5',
        },
        finalObservations: 'Updated observations',
      })
    );
  });
});

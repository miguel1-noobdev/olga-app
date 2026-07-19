import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFormula } from '@/app/laboratorio/formulas/nueva/actions';
import {
  createEmptyFormulaForm,
  toCreateFormulaInput,
} from '@/lib/formulas/formula-form-contract';

const { getCurrentUserMock, connectToDatabaseMock, createMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
    create: createMock,
  })),
}));

describe('submitFormula server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  it('rejects unauthenticated calls before database access', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(submitFormula(buildValidForm())).resolves.toEqual({ success: false, error: 'No autorizado' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  function buildValidForm() {
    const form = createEmptyFormulaForm();
    form.productName = 'Lavender cream';
    form.formulaCode = 'CF-001';
    form.formulaCreatedAt = '2026-03-10';
    form.formulaVersion = '1.0';
    form.productType = 'cream';
    form.targetBatchGrams = 500;
    form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
    form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
    return form;
  }

  it('returns validation errors without touching the database for empty form', async () => {
    const form = createEmptyFormulaForm();

    const result = await submitFormula(form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.productName).toBeDefined();
    expect('errors' in result && result.errors.formulaCode).toBeDefined();
    expect('errors' in result && result.errors.productType).toBeDefined();
    expect('errors' in result && result.errors.targetBatchGrams).toBeDefined();
    expect('errors' in result && result.errors.phases).toBeDefined();
    expect('errors' in result && result.errors.procedureSteps).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('connects to database, creates formula, and returns the detail destination', async () => {
    const form = buildValidForm();
    createMock.mockResolvedValue({
      id: 'formula-123',
      productName: form.productName,
    });

    await expect(submitFormula(form)).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/formulas/formula-123',
    });

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(toCreateFormulaInput(form));
  });

  it('returns a generic error when repository create fails', async () => {
    const form = buildValidForm();
    createMock.mockRejectedValue(new Error('Database write failed'));

    const result = await submitFormula(form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Database write failed');
  });

  it('passes rich formula blocks to the repository on create', async () => {
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
    form.finalObservations = 'First successful batch';
    createMock.mockResolvedValue({
      id: 'formula-rich',
      productName: form.productName,
    });

    await expect(submitFormula(form)).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/formulas/formula-rich',
    });

    expect(createMock).toHaveBeenCalledWith(
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
        finalObservations: 'First successful batch',
      })
    );
  });
});

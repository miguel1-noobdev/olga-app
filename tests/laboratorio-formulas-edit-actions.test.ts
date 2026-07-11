import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFormulaUpdate } from '@/app/laboratorio/formulas/[id]/edit/actions';
import {
  createEmptyFormulaForm,
  toUpdateFormulaInput,
} from '@/lib/formulas/formula-form-contract';

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

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
    update: updateMock,
  })),
}));

describe('submitFormulaUpdate server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const result = await submitFormulaUpdate('formula-1', form);

    expect(result.success).toBe(false);
    expect('errors' in result && result.errors.productName).toBeDefined();
    expect('errors' in result && result.errors.formulaCode).toBeDefined();
    expect('errors' in result && result.errors.productType).toBeDefined();
    expect('errors' in result && result.errors.targetBatchGrams).toBeDefined();
    expect('errors' in result && result.errors.phases).toBeDefined();
    expect('errors' in result && result.errors.procedureSteps).toBeDefined();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('connects to database, updates formula, and redirects to detail', async () => {
    const form = buildValidForm();
    updateMock.mockResolvedValue({
      id: 'formula-1',
      productName: form.productName,
    });

    await expect(submitFormulaUpdate('formula-1', form)).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/formulas/formula-1'
    );

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith('formula-1', toUpdateFormulaInput(form));
  });

  it('returns a generic error when repository update fails', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValue(new Error('Database write failed'));

    const result = await submitFormulaUpdate('formula-1', form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Database write failed');
  });

  it('returns an error when formula is not found', async () => {
    const form = buildValidForm();
    updateMock.mockRejectedValue(new Error('Formula not found'));

    const result = await submitFormulaUpdate('unknown-id', form);

    expect(result.success).toBe(false);
    expect('error' in result && result.error).toBe('Formula not found');
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
      id: 'formula-1',
      productName: form.productName,
    });

    await expect(submitFormulaUpdate('formula-1', form)).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/formulas/formula-1'
    );

    expect(updateMock).toHaveBeenCalledWith(
      'formula-1',
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

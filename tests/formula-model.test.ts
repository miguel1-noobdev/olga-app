import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FormulaModel } from '@/lib/db/models/formula';

describe('FormulaModel', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await FormulaModel.syncIndexes();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function validFormulaInput() {
    return {
      productName: 'Crema de lavanda',
      formulaCode: 'CF-001',
      formulaCreatedAt: new Date('2026-01-15'),
      formulaVersion: '1.0',
      productObjectives: ['hidratante', 'calmante'],
      productType: 'crema',
      status: 'draft' as const,
      targetBatchGrams: 500,
      phases: {
        aqueous: [{ ingredient: 'Agua destilada', grams: 300 }],
        oil: [{ ingredient: 'Aceite de almendras', grams: 150 }],
        actives: [{ ingredient: 'Extracto de lavanda', grams: 50 }],
      },
      procedureSteps: [
        { stepNumber: 2, instruction: 'Mezclar fase oleosa' },
        { stepNumber: 1, instruction: 'Calentar fase acuosa' },
      ],
      technicalData: {
        finalPh: 5.5,
        productionTemperatureCelsius: 65,
        mixingTimeMinutes: 30,
        preservative: 'Cosgard',
        fragrance: 'Lavanda',
        color: 'Blanco',
      },
      productEvaluation: {
        texture: 'cremosa',
        color: 'blanco',
        smell: 'lavanda',
        viscosity: 'media',
        absorption: 'rápida',
        foam: 'no aplica',
        stability: 'estable',
      },
      useTest: {
        approxExpirationDate: new Date('2026-07-15'),
        entries: [
          { date: new Date('2026-01-20'), note: 'Primera impresión positiva' },
        ],
      },
      inci: {
        function: 'emoliente',
        emulsionType: 'o/w',
        dosage: 'según fórmula',
        temperature: '<70°C',
        compatibility: 'buena',
        inconveniences: 'ninguna',
        ph: '5.0-5.5',
      },
      finalObservations: 'Primera versión de prueba.',
    };
  }

  it('persists a complete formula with all blocks', async () => {
    const formula = await FormulaModel.create(validFormulaInput());

    expect(formula.productName).toBe('Crema de lavanda');
    expect(formula.formulaCode).toBe('CF-001');
    expect(formula.formulaVersion).toBe('1.0');
    expect(formula.targetBatchGrams).toBe(500);
    expect(formula.phases?.aqueous).toHaveLength(1);
    expect(formula.phases?.oil).toHaveLength(1);
    expect(formula.phases?.actives).toHaveLength(1);
    expect(formula.technicalData?.finalPh).toBe(5.5);
    expect(formula.useTest?.entries).toHaveLength(1);
    expect(formula.inci?.function).toBe('emoliente');
    expect(formula.finalObservations).toBe('Primera versión de prueba.');
  });

  it('rejects when required identity fields are missing', async () => {
    await expect(FormulaModel.create({})).rejects.toThrow();
  });

  it('rejects duplicate formulaCode', async () => {
    await FormulaModel.create(validFormulaInput());

    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        productName: 'Otra crema',
        formulaVersion: '1.1',
      })
    ).rejects.toThrow();
  });

  it('rejects an invalid status value', async () => {
    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        status: 'invalid-status' as unknown as 'draft',
      })
    ).rejects.toThrow();
  });

  it('rejects targetBatchGrams less than or equal to zero', async () => {
    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        targetBatchGrams: 0,
      })
    ).rejects.toThrow();

    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        targetBatchGrams: -100,
      })
    ).rejects.toThrow();
  });

  it('rejects ingredients with grams less than or equal to zero', async () => {
    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        phases: {
          aqueous: [{ ingredient: 'Agua destilada', grams: 0 }],
        },
      })
    ).rejects.toThrow();

    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        phases: {
          oil: [{ ingredient: 'Aceite', grams: -10 }],
        },
      })
    ).rejects.toThrow();
  });

  it('normalizes procedure steps by sorting them by stepNumber', async () => {
    const formula = await FormulaModel.create(validFormulaInput());

    expect(formula.procedureSteps).toHaveLength(2);
    expect(formula.procedureSteps[0].stepNumber).toBe(1);
    expect(formula.procedureSteps[1].stepNumber).toBe(2);
  });

  it('rejects procedure steps with duplicate stepNumber', async () => {
    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        procedureSteps: [
          { stepNumber: 1, instruction: 'Paso uno' },
          { stepNumber: 1, instruction: 'Paso repetido' },
        ],
      })
    ).rejects.toThrow();
  });

  it('rejects procedure steps with non-positive stepNumber', async () => {
    await expect(
      FormulaModel.create({
        ...validFormulaInput(),
        procedureSteps: [{ stepNumber: 0, instruction: 'Paso inválido' }],
      })
    ).rejects.toThrow();
  });

  it('accepts a formula without optional phases', async () => {
    const input = validFormulaInput();
    delete (input as any).phases;

    const formula = await FormulaModel.create(input);

    expect(formula.phases).toBeUndefined();
  });

  it('accepts a formula with only some phase arrays', async () => {
    const formula = await FormulaModel.create({
      ...validFormulaInput(),
      phases: {
        aqueous: [{ ingredient: 'Agua destilada', grams: 500 }],
      },
    });

    expect(formula.phases?.aqueous).toHaveLength(1);
    expect(formula.phases?.oil).toBeUndefined();
    expect(formula.phases?.actives).toBeUndefined();
  });

  it('defines only one formulaCode index', () => {
    const codeIndexes = FormulaModel.schema
      .indexes()
      .filter(([fields]: [Record<string, unknown>, unknown]) =>
        JSON.stringify(fields) === JSON.stringify({ formulaCode: 1 })
      );

    expect(codeIndexes).toHaveLength(1);
  });

  it('adds createdAt and updatedAt timestamps', async () => {
    const formula = await FormulaModel.create(validFormulaInput());

    expect(formula.createdAt).toBeInstanceOf(Date);
    expect(formula.updatedAt).toBeInstanceOf(Date);
  });
});

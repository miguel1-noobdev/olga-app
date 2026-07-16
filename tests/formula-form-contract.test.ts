import { describe, it, expect } from 'vitest';
import {
  createEmptyFormulaForm,
  toCreateFormulaInput,
  toUpdateFormulaInput,
  toFormulaFormValues,
  validateMinimumFormulaForm,
  DEFAULT_FORMULA_STATUS,
} from '@/lib/formulas/formula-form-contract';

describe('formula form contract', () => {
  describe('createEmptyFormulaForm', () => {
    it('returns a draft formula with one empty procedure step and empty phases', () => {
      const form = createEmptyFormulaForm();

      expect(form.productName).toBe('');
      expect(form.formulaCode).toBe('');
      expect(form.formulaVersion).toBe('1.0');
      expect(form.status).toBe(DEFAULT_FORMULA_STATUS);
      expect(form.status).toBe('draft');
      expect(form.targetBatchGrams).toBe('');
      expect(form.phases.aqueous).toEqual([]);
      expect(form.phases.oil).toEqual([]);
      expect(form.phases.actives).toEqual([]);
      expect(form.procedureSteps).toEqual([{ stepNumber: 1, instruction: '' }]);
      expect(form.productObjectives).toEqual([]);
      expect(form.technicalData).toEqual({
        finalPh: '',
        productionTemperatureCelsius: '',
        mixingTimeMinutes: '',
        preservative: '',
        fragrance: '',
        color: '',
      });
      expect(form.productEvaluation).toEqual({
        texture: '',
        color: '',
        smell: '',
        viscosity: '',
        absorption: '',
        foam: '',
        stability: '',
      });
      expect(form.useTest).toEqual({ approxExpirationDate: '', entries: [] });
      expect(form.inci).toEqual({
        function: '',
        emulsionType: '',
        dosage: '',
        temperature: '',
        compatibility: '',
        inconveniences: '',
        ph: '',
      });
      expect(form.finalObservations).toBe('');
    });

    it('uses today as the default creation date', () => {
      const today = new Date().toISOString().split('T')[0];
      const form = createEmptyFormulaForm();

      expect(form.formulaCreatedAt).toBe(today);
    });
  });

  describe('toCreateFormulaInput', () => {
    it('maps form values to the repository input shape', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'cf-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.1';
      form.productObjectives = [
        { value: 'hydrating' },
        { value: 'soothing' },
      ];
      form.productType = 'cream';
      form.status = 'testing';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Purified water', grams: 300 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix aqueous phase' }];
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

      const input = toCreateFormulaInput(form);

      expect(input.productName).toBe('Lavender cream');
      expect(input.formulaCode).toBe('cf-001');
      expect(input.formulaCreatedAt).toEqual(new Date('2026-03-10'));
      expect(input.formulaVersion).toBe('1.1');
      expect(input.productObjectives).toEqual(['hydrating', 'soothing']);
      expect(input.productType).toBe('cream');
      expect(input.status).toBe('testing');
      expect(input.targetBatchGrams).toBe(500);
      expect(input.phases).toEqual({
        aqueous: [{ ingredient: 'Purified water', grams: 300 }],
      });
      expect(input.procedureSteps).toEqual([{ stepNumber: 1, instruction: 'Mix aqueous phase' }]);
      expect(input.technicalData).toEqual({
        finalPh: 5.5,
        productionTemperatureCelsius: 75,
        mixingTimeMinutes: 20,
        preservative: 'Potassium sorbate',
        fragrance: 'Lavender',
        color: 'White',
      });
      expect(input.productEvaluation).toEqual({
        texture: 'Creamy',
        color: 'White',
        smell: 'Lavender',
        viscosity: 'Medium',
        absorption: 'Fast',
        foam: 'None',
        stability: 'Stable',
      });
      expect(input.useTest).toEqual({
        approxExpirationDate: new Date('2026-12-01'),
        entries: [{ date: new Date('2026-03-15'), note: 'Good texture' }],
      });
      expect(input.inci).toEqual({
        function: 'Emollient',
        emulsionType: 'O/W',
        dosage: '5%',
        temperature: 'Room',
        compatibility: 'Good',
        inconveniences: 'None',
        ph: '5.5',
      });
      expect(input.finalObservations).toBe('First successful batch');
    });

    it('trims string fields and drops empty phases', () => {
      const form = createEmptyFormulaForm();
      form.productName = '  Lavender cream  ';
      form.formulaCode = '  CF-002  ';
      form.productType = '  cream  ';
      form.targetBatchGrams = 250;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 200 }];
      form.phases.oil = [{ ingredient: '', grams: '' }];
      form.procedureSteps = [{ stepNumber: 1, instruction: '  Mix  ' }];
      form.productObjectives = [{ value: '  ' }, { value: 'moisturizing  ' }];

      const input = toCreateFormulaInput(form);

      expect(input.productName).toBe('Lavender cream');
      expect(input.formulaCode).toBe('CF-002');
      expect(input.productType).toBe('cream');
      expect(input.phases).toEqual({ aqueous: [{ ingredient: 'Water', grams: 200 }] });
      expect(input.procedureSteps).toEqual([{ stepNumber: 1, instruction: 'Mix' }]);
      expect(input.productObjectives).toEqual(['moisturizing']);
      expect(input.technicalData).toBeUndefined();
      expect(input.productEvaluation).toBeUndefined();
      expect(input.useTest).toBeUndefined();
      expect(input.inci).toBeUndefined();
      expect(input.finalObservations).toBeUndefined();
    });

    it('keeps only populated rich block fields', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-003';
      form.productType = 'cream';
      form.targetBatchGrams = 300;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 300 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
      form.technicalData = {
        finalPh: 5.5,
        productionTemperatureCelsius: '',
        mixingTimeMinutes: '',
        preservative: '',
        fragrance: '',
        color: '',
      };
      form.productEvaluation = {
        texture: '',
        color: '',
        smell: '',
        viscosity: '',
        absorption: '',
        foam: '',
        stability: '',
      };
      form.useTest = { approxExpirationDate: '', entries: [] };
      form.inci = {
        function: '',
        emulsionType: '',
        dosage: '',
        temperature: '',
        compatibility: '',
        inconveniences: '',
        ph: '',
      };
      form.finalObservations = '   ';

      const input = toCreateFormulaInput(form);

      expect(input.technicalData).toEqual({ finalPh: 5.5 });
      expect(input.productEvaluation).toBeUndefined();
      expect(input.useTest).toBeUndefined();
      expect(input.inci).toBeUndefined();
      expect(input.finalObservations).toBeUndefined();
    });
  });

  describe('toUpdateFormulaInput', () => {
    it('maps form values to the repository update input shape', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'cf-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.2';
      form.productType = 'cream';
      form.status = 'validated';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Purified water', grams: 300 }];
      form.phases.actives = [{ ingredient: 'Lavender extract', grams: 10 }];
      form.procedureSteps = [
        { stepNumber: 1, instruction: 'Mix aqueous phase' },
        { stepNumber: 2, instruction: 'Add actives' },
      ];

      const input = toUpdateFormulaInput(form);

      expect(input.productName).toBe('Lavender cream');
      expect(input.formulaCode).toBe('cf-001');
      expect(input.formulaCreatedAt).toEqual(new Date('2026-03-10'));
      expect(input.formulaVersion).toBe('1.2');
      expect(input.productType).toBe('cream');
      expect(input.status).toBe('validated');
      expect(input.targetBatchGrams).toBe(500);
      expect(input.phases).toEqual({
        aqueous: [{ ingredient: 'Purified water', grams: 300 }],
        actives: [{ ingredient: 'Lavender extract', grams: 10 }],
      });
      expect(input.procedureSteps).toEqual([
        { stepNumber: 1, instruction: 'Mix aqueous phase' },
        { stepNumber: 2, instruction: 'Add actives' },
      ]);
    });

    it('trims string fields and drops empty phases', () => {
      const form = createEmptyFormulaForm();
      form.productName = '  Lavender cream  ';
      form.formulaCode = '  CF-002  ';
      form.productType = '  cream  ';
      form.targetBatchGrams = 250;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 200 }];
      form.phases.oil = [{ ingredient: '', grams: '' }];
      form.procedureSteps = [{ stepNumber: 1, instruction: '  Mix  ' }];

      const input = toUpdateFormulaInput(form);

      expect(input.productName).toBe('Lavender cream');
      expect(input.formulaCode).toBe('CF-002');
      expect(input.productType).toBe('cream');
      expect(input.phases).toEqual({ aqueous: [{ ingredient: 'Water', grams: 200 }] });
      expect(input.procedureSteps).toEqual([{ stepNumber: 1, instruction: 'Mix' }]);
    });

    it('carries empty optional blocks so updates can clear existing data', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-002';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 250;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 250 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const input = toUpdateFormulaInput(form);

      expect(input.productObjectives).toEqual([]);
      expect(input.technicalData).toEqual({});
      expect(input.productEvaluation).toEqual({});
      expect(input.useTest).toEqual({});
      expect(input.inci).toEqual({});
      expect(input.finalObservations).toBe('');
    });

    it('maps partial rich blocks and drops only empty nested fields', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-002';
      form.productType = 'cream';
      form.targetBatchGrams = 250;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 250 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
      form.technicalData = {
        finalPh: 5.5,
        productionTemperatureCelsius: '',
        mixingTimeMinutes: '',
        preservative: 'Sorbate',
        fragrance: '',
        color: '',
      };
      form.useTest = {
        approxExpirationDate: '2026-12-01',
        entries: [],
      };

      const input = toUpdateFormulaInput(form);

      expect(input.technicalData).toEqual({ finalPh: 5.5, preservative: 'Sorbate' });
      expect(input.useTest).toEqual({ approxExpirationDate: new Date('2026-12-01') });
    });
  });

  describe('toFormulaFormValues', () => {
    it('maps a complete formula record to the form contract shape', () => {
      const record = {
        id: 'formula-1',
        productName: 'Lavender cream',
        formulaCode: 'CF-001',
        formulaCreatedAt: '2026-01-15T00:00:00.000Z',
        formulaVersion: '1.1',
        productObjectives: ['hydrating'],
        productType: 'cream',
        status: 'validated' as const,
        targetBatchGrams: 500,
        phases: {
          aqueous: [{ ingredient: 'Water', grams: 300 }],
          oil: [{ ingredient: 'Oil', grams: 100 }],
          actives: [{ ingredient: 'Active', grams: 10 }],
        },
        procedureSteps: [
          { stepNumber: 1, instruction: 'Mix' },
          { stepNumber: 2, instruction: 'Heat' },
        ],
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      };

      const values = toFormulaFormValues(record);

      expect(values.productName).toBe('Lavender cream');
      expect(values.formulaCode).toBe('CF-001');
      expect(values.formulaCreatedAt).toBe('2026-01-15');
      expect(values.formulaVersion).toBe('1.1');
      expect(values.productType).toBe('cream');
      expect(values.status).toBe('validated');
      expect(values.targetBatchGrams).toBe(500);
      expect(values.phases.aqueous).toEqual([{ ingredient: 'Water', grams: 300 }]);
      expect(values.phases.oil).toEqual([{ ingredient: 'Oil', grams: 100 }]);
      expect(values.phases.actives).toEqual([{ ingredient: 'Active', grams: 10 }]);
      expect(values.procedureSteps).toEqual([
        { stepNumber: 1, instruction: 'Mix' },
        { stepNumber: 2, instruction: 'Heat' },
      ]);
      expect(values.productObjectives).toEqual([{ value: 'hydrating' }]);
      expect(values.technicalData).toEqual({
        finalPh: '',
        productionTemperatureCelsius: '',
        mixingTimeMinutes: '',
        preservative: '',
        fragrance: '',
        color: '',
      });
      expect(values.productEvaluation).toEqual({
        texture: '',
        color: '',
        smell: '',
        viscosity: '',
        absorption: '',
        foam: '',
        stability: '',
      });
      expect(values.useTest).toEqual({ approxExpirationDate: '', entries: [] });
      expect(values.inci).toEqual({
        function: '',
        emulsionType: '',
        dosage: '',
        temperature: '',
        compatibility: '',
        inconveniences: '',
        ph: '',
      });
      expect(values.finalObservations).toBe('');
    });

    it('maps rich blocks from a record', () => {
      const record = {
        id: 'formula-rich',
        productName: 'Rich cream',
        formulaCode: 'CF-RICH',
        formulaCreatedAt: '2026-04-01T00:00:00.000Z',
        formulaVersion: '2.0',
        productObjectives: ['hydrating', 'soothing'],
        productType: 'cream',
        status: 'validated' as const,
        targetBatchGrams: 500,
        phases: {},
        procedureSteps: [{ stepNumber: 1, instruction: 'Mix' }],
        technicalData: {
          finalPh: 5.5,
          productionTemperatureCelsius: 75,
          mixingTimeMinutes: 20,
          preservative: 'Sorbate',
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
          approxExpirationDate: '2026-12-01T00:00:00.000Z',
          entries: [{ date: '2026-04-15T00:00:00.000Z', note: 'Good' }],
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
        finalObservations: 'Ready for production',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      };

      const values = toFormulaFormValues(record);

      expect(values.productObjectives).toEqual([
        { value: 'hydrating' },
        { value: 'soothing' },
      ]);
      expect(values.technicalData).toEqual({
        finalPh: 5.5,
        productionTemperatureCelsius: 75,
        mixingTimeMinutes: 20,
        preservative: 'Sorbate',
        fragrance: 'Lavender',
        color: 'White',
      });
      expect(values.productEvaluation).toEqual({
        texture: 'Creamy',
        color: 'White',
        smell: 'Lavender',
        viscosity: 'Medium',
        absorption: 'Fast',
        foam: 'None',
        stability: 'Stable',
      });
      expect(values.useTest).toEqual({
        approxExpirationDate: '2026-12-01',
        entries: [{ date: '2026-04-15', note: 'Good' }],
      });
      expect(values.inci).toEqual({
        function: 'Emollient',
        emulsionType: 'O/W',
        dosage: '5%',
        temperature: 'Room',
        compatibility: 'Good',
        inconveniences: 'None',
        ph: '5.5',
      });
      expect(values.finalObservations).toBe('Ready for production');
    });

    it('uses empty arrays for missing phases', () => {
      const record = {
        id: 'formula-2',
        productName: 'Minimal formula',
        formulaCode: 'CF-002',
        formulaCreatedAt: '2026-02-01T00:00:00.000Z',
        formulaVersion: '1.0',
        productObjectives: [],
        productType: 'oil',
        status: 'draft' as const,
        targetBatchGrams: 100,
        phases: undefined,
        procedureSteps: [{ stepNumber: 1, instruction: 'Mix' }],
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      };

      const values = toFormulaFormValues(record);

      expect(values.phases.aqueous).toEqual([]);
      expect(values.phases.oil).toEqual([]);
      expect(values.phases.actives).toEqual([]);
    });

    it('provides one empty procedure step when the record has none', () => {
      const record = {
        id: 'formula-3',
        productName: 'No steps formula',
        formulaCode: 'CF-003',
        formulaCreatedAt: '2026-03-01T00:00:00.000Z',
        formulaVersion: '1.0',
        productObjectives: [],
        productType: 'serum',
        status: 'draft' as const,
        targetBatchGrams: 50,
        phases: {},
        procedureSteps: [],
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      };

      const values = toFormulaFormValues(record);

      expect(values.procedureSteps).toEqual([{ stepNumber: 1, instruction: '' }]);
    });
  });

  describe('validateMinimumFormulaForm', () => {
    it('accepts a complete minimum formula', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects missing identity fields', () => {
      const form = createEmptyFormulaForm();
      form.productName = '';
      form.formulaCode = '';
      form.formulaCreatedAt = '';
      form.formulaVersion = '';
      form.productType = '';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.productName).toBeDefined();
      expect(result.errors.formulaCode).toBeDefined();
      expect(result.errors.formulaCreatedAt).toBeDefined();
      expect(result.errors.formulaVersion).toBeDefined();
      expect(result.errors.productType).toBeDefined();
    });

    it('rejects non-positive target batch grams', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 0;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.targetBatchGrams).toBeDefined();
    });

    it('rejects formulas without at least one populated phase', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.phases).toBeDefined();
    });

    it('rejects formulas without at least one procedure step', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: '' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.procedureSteps).toBeDefined();
    });

    it('rejects partially filled ingredient rows', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: '' }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.phases).toBe('Cada ingrediente debe tener un nombre y gramos mayores a 0');
    });

    it('rejects final pH outside the 0-14 range', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
      form.technicalData.finalPh = 14.5;

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.technicalData).toBe('El pH final debe estar entre 0 y 14');
    });

    it('rejects negative technical data numbers', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
      form.technicalData.productionTemperatureCelsius = -5;

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.technicalData).toBe(
        'La temperatura de producción debe ser mayor o igual a 0'
      );
    });

    it('rejects use test entries missing a date or note', () => {
      const form = createEmptyFormulaForm();
      form.productName = 'Lavender cream';
      form.formulaCode = 'CF-001';
      form.formulaCreatedAt = '2026-03-10';
      form.formulaVersion = '1.0';
      form.productType = 'cream';
      form.targetBatchGrams = 500;
      form.phases.aqueous = [{ ingredient: 'Water', grams: 500 }];
      form.procedureSteps = [{ stepNumber: 1, instruction: 'Mix' }];
      form.useTest.entries = [{ date: '2026-03-15', note: '' }];

      const result = validateMinimumFormulaForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.useTest).toBe('Cada entrada de prueba de uso debe tener una fecha y una nota');
    });
  });
});

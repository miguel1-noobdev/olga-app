import { describe, it, expect } from 'vitest';
import {
  createEmptyLotForm,
  toCreateLotInput,
  validateMinimumLotForm,
} from '@/lib/lots/lot-form-contract';

describe('lot form contract', () => {
  describe('createEmptyLotForm', () => {
    it('returns a planned lot seeded from the source formula defaults', () => {
      const form = createEmptyLotForm('formula-1', 500);

      expect(form.formulaId).toBe('formula-1');
      expect(form.targetBatchGrams).toBe(500);
      expect(form.status).toBe('planned');
      expect(form.plannedAt).toBe('');
      expect(form.operationalObservations).toBe('');
    });
  });

  describe('toCreateLotInput', () => {
    it('maps form values to the repository input shape', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.targetBatchGrams = 750;
      form.status = 'in_progress';
      form.plannedAt = '2026-04-15';
      form.operationalObservations = 'Use fresh distilled water';

      const input = toCreateLotInput(form);

      expect(input.formulaId).toBe('formula-1');
      expect(input.targetBatchGrams).toBe(750);
      expect(input.status).toBe('in_progress');
      expect(input.plannedAt).toEqual(new Date('2026-04-15'));
      expect(input.operationalObservations).toBe('Use fresh distilled water');
    });

    it('drops optional fields when they are empty', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.targetBatchGrams = 250;

      const input = toCreateLotInput(form);

      expect(input.plannedAt).toBeUndefined();
      expect(input.operationalObservations).toBeUndefined();
    });

    it('trims the operational observations string', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.operationalObservations = '  Fresh water  ';

      const input = toCreateLotInput(form);

      expect(input.operationalObservations).toBe('Fresh water');
    });

    it('treats whitespace-only observations as empty', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.operationalObservations = '   ';

      const input = toCreateLotInput(form);

      expect(input.operationalObservations).toBeUndefined();
    });
  });

  describe('validateMinimumLotForm', () => {
    it('accepts a complete minimum lot', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.targetBatchGrams = 500;

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects missing target batch grams', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.targetBatchGrams = '';

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.targetBatchGrams).toBeDefined();
    });

    it('rejects non-positive target batch grams', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.targetBatchGrams = 0;

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.targetBatchGrams).toMatch(/greater than 0/i);
    });

    it('rejects an invalid status value', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.status = 'invalid-status' as unknown as 'planned';

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.status).toBeDefined();
    });

    it('rejects an invalid planned date', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.plannedAt = 'not-a-date';

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.plannedAt).toMatch(/invalid/i);
    });

    it('accepts an empty planned date', () => {
      const form = createEmptyLotForm('formula-1', 500);
      form.plannedAt = '';

      const result = validateMinimumLotForm(form);

      expect(result.valid).toBe(true);
      expect(result.errors.plannedAt).toBeUndefined();
    });
  });
});

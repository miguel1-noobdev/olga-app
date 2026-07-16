import { describe, it, expect } from 'vitest';
import {
  LotFollowUpFormValues,
  createEmptyLotFollowUpFormValues,
  toLotFollowUpEntry,
  validateMinimumLotFollowUpForm,
} from '@/lib/lots/lot-follow-up-form-contract';

describe('lot-follow-up-form-contract', () => {
  describe('createEmptyLotFollowUpFormValues', () => {
    it('returns empty date and note', () => {
      expect(createEmptyLotFollowUpFormValues()).toEqual({
        date: '',
        note: '',
      });
    });
  });

  describe('toLotFollowUpEntry', () => {
    it('converts valid date string to a Date and trims the note', () => {
      const result = toLotFollowUpEntry({
        date: '2026-05-10',
        note: '  Texture stable.  ',
      });

      expect(result.date).toEqual(new Date('2026-05-10'));
      expect(result.note).toBe('Texture stable.');
    });
  });

  describe('validateMinimumLotFollowUpForm', () => {
    it('requires a date', () => {
      const values: LotFollowUpFormValues = { date: '', note: 'Note' };
      const { valid, errors } = validateMinimumLotFollowUpForm(values);

      expect(valid).toBe(false);
      expect(errors.date).toBe('La fecha es obligatoria');
    });

    it('rejects an invalid date', () => {
      const values: LotFollowUpFormValues = { date: 'not-a-date', note: 'Note' };
      const { valid, errors } = validateMinimumLotFollowUpForm(values);

      expect(valid).toBe(false);
      expect(errors.date).toBe('La fecha no es válida');
    });

    it('requires a note', () => {
      const values: LotFollowUpFormValues = { date: '2026-05-10', note: '' };
      const { valid, errors } = validateMinimumLotFollowUpForm(values);

      expect(valid).toBe(false);
      expect(errors.note).toBe('La nota es obligatoria');
    });

    it('rejects a note containing only whitespace', () => {
      const values: LotFollowUpFormValues = { date: '2026-05-10', note: '   ' };
      const { valid, errors } = validateMinimumLotFollowUpForm(values);

      expect(valid).toBe(false);
      expect(errors.note).toBe('La nota es obligatoria');
    });

    it('accepts valid values', () => {
      const values: LotFollowUpFormValues = {
        date: '2026-05-10',
        note: 'Texture stable.',
      };
      const { valid, errors } = validateMinimumLotFollowUpForm(values);

      expect(valid).toBe(true);
      expect(errors).toEqual({});
    });
  });
});

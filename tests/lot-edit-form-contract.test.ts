import { describe, it, expect } from 'vitest';
import {
  createEmptyLotEditFormValues,
  getLotLifecyclePermissions,
  toLotEditFormValues,
  toUpdateLotInput,
  validateMinimumLotEditForm,
} from '@/lib/lots/lot-edit-form-contract';
import { LotStatus } from '@/lib/lots/lot-types';

describe('lot edit form contract', () => {
  describe('getLotLifecyclePermissions', () => {
    it('allows planned lots to edit production and rescale their snapshot', () => {
      expect(getLotLifecyclePermissions('planned')).toEqual({
        canEditProduction: true,
        canRescaleSnapshot: true,
        canAppendFollowUp: true,
      });
    });

    it('freezes completed production while keeping follow-up appendable', () => {
      expect(getLotLifecyclePermissions('completed')).toEqual({
        canEditProduction: false,
        canRescaleSnapshot: false,
        canAppendFollowUp: true,
      });
    });

    it('keeps cancelled lots editable and able to rescale their snapshot', () => {
      expect(getLotLifecyclePermissions('cancelled')).toEqual({
        canEditProduction: true,
        canRescaleSnapshot: true,
        canAppendFollowUp: true,
      });
    });
  });

  describe('createEmptyLotEditFormValues', () => {
    it('returns an empty operational form seeded with planned status', () => {
      const form = createEmptyLotEditFormValues();

      expect(form.status).toBe('planned');
      expect(form.plannedAt).toBe('');
      expect(form.startedAt).toBe('');
      expect(form.completedAt).toBe('');
      expect(form.operationalObservations).toBe('');
    });
  });

  describe('toLotEditFormValues', () => {
    it('maps lot record dates to date input values', () => {
      const form = toLotEditFormValues({
        status: 'in_progress',
        plannedAt: '2026-04-15T00:00:00.000Z',
        startedAt: '2026-04-16T00:00:00.000Z',
        completedAt: '2026-04-17T00:00:00.000Z',
        operationalObservations: 'Use fresh distilled water',
      });

      expect(form.status).toBe('in_progress');
      expect(form.plannedAt).toBe('2026-04-15');
      expect(form.startedAt).toBe('2026-04-16');
      expect(form.completedAt).toBe('2026-04-17');
      expect(form.operationalObservations).toBe('Use fresh distilled water');
    });

    it('maps null dates to empty strings', () => {
      const form = toLotEditFormValues({
        status: 'planned',
        plannedAt: null,
        startedAt: null,
        completedAt: null,
      });

      expect(form.plannedAt).toBe('');
      expect(form.startedAt).toBe('');
      expect(form.completedAt).toBe('');
      expect(form.operationalObservations).toBe('');
    });
  });

  describe('toUpdateLotInput', () => {
    it('maps form values to the repository update input shape', () => {
      const form = createEmptyLotEditFormValues();
      form.status = 'in_progress';
      form.plannedAt = '2026-04-15';
      form.startedAt = '2026-04-16';
      form.completedAt = '2026-04-17';
      form.operationalObservations = 'Use fresh distilled water';

      const input = toUpdateLotInput(form);

      expect(input.status).toBe('in_progress');
      expect(input.plannedAt).toEqual(new Date('2026-04-15'));
      expect(input.startedAt).toEqual(new Date('2026-04-16'));
      expect(input.completedAt).toEqual(new Date('2026-04-17'));
      expect(input.operationalObservations).toBe('Use fresh distilled water');
    });

    it('drops empty optional dates and observations', () => {
      const form = createEmptyLotEditFormValues();

      const input = toUpdateLotInput(form);

      expect(input.plannedAt).toBeUndefined();
      expect(input.startedAt).toBeUndefined();
      expect(input.completedAt).toBeUndefined();
      expect(input.operationalObservations).toBeUndefined();
    });

    it('trims the operational observations string', () => {
      const form = createEmptyLotEditFormValues();
      form.operationalObservations = '  Fresh water  ';

      const input = toUpdateLotInput(form);

      expect(input.operationalObservations).toBe('Fresh water');
    });

    it('treats whitespace-only observations as empty', () => {
      const form = createEmptyLotEditFormValues();
      form.operationalObservations = '   ';

      const input = toUpdateLotInput(form);

      expect(input.operationalObservations).toBeUndefined();
    });
  });

  describe('validateMinimumLotEditForm', () => {
    it('accepts a complete minimum operational edit', () => {
      const form = createEmptyLotEditFormValues();
      form.status = 'in_progress';
      form.plannedAt = '2026-04-15';
      form.startedAt = '2026-04-16';
      form.completedAt = '2026-04-17';

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('accepts an empty operational edit', () => {
      const form = createEmptyLotEditFormValues();

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(true);
    });

    it('rejects an invalid status value', () => {
      const form = createEmptyLotEditFormValues();
      form.status = 'invalid-status' as unknown as LotStatus;

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.status).toBeDefined();
    });

    it('rejects an invalid planned date', () => {
      const form = createEmptyLotEditFormValues();
      form.plannedAt = 'not-a-date';

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.plannedAt).toMatch(/invalid/i);
    });

    it('rejects an invalid started date', () => {
      const form = createEmptyLotEditFormValues();
      form.startedAt = 'not-a-date';

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.startedAt).toMatch(/invalid/i);
    });

    it('rejects an invalid completed date', () => {
      const form = createEmptyLotEditFormValues();
      form.completedAt = 'not-a-date';

      const result = validateMinimumLotEditForm(form);

      expect(result.valid).toBe(false);
      expect(result.errors.completedAt).toMatch(/invalid/i);
    });
  });
});

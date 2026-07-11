import { describe, it, expect } from 'vitest';
import { ROLES, isProductora, isAdmin, isStaff } from '@/lib/auth/roles';

describe('auth roles', () => {
  describe('ROLES constant', () => {
    it('exposes the three known roles', () => {
      expect(ROLES.SUSCRIPTORA).toBe('suscriptora');
      expect(ROLES.PRODUCTORA).toBe('productora');
      expect(ROLES.ADMIN).toBe('admin');
    });

    it('locks Olga laboratory access to the productora role', () => {
      expect(ROLES.PRODUCTORA).toBe('productora');
    });
  });

  describe('isProductora', () => {
    it('returns true for the productora role', () => {
      expect(isProductora('productora')).toBe(true);
    });

    it('returns false for suscriptora and admin', () => {
      expect(isProductora('suscriptora')).toBe(false);
      expect(isProductora('admin')).toBe(false);
    });

    it('returns false for unknown roles', () => {
      expect(isProductora('editor')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true for the admin role', () => {
      expect(isAdmin('admin')).toBe(true);
    });

    it('returns false for productora and suscriptora', () => {
      expect(isAdmin('productora')).toBe(false);
      expect(isAdmin('suscriptora')).toBe(false);
    });
  });

  describe('isStaff', () => {
    it('returns true for productora and admin', () => {
      expect(isStaff('productora')).toBe(true);
      expect(isStaff('admin')).toBe(true);
    });

    it('returns false for suscriptora', () => {
      expect(isStaff('suscriptora')).toBe(false);
    });

    it('returns false for unknown roles', () => {
      expect(isStaff('editor')).toBe(false);
    });
  });
});

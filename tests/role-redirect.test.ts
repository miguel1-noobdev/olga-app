import { describe, it, expect } from 'vitest';
import { getDefaultRedirectForRole, DEFAULT_REDIRECTS } from '@/lib/auth/role-redirect';
import { ROLES } from '@/lib/auth/roles';

describe('getDefaultRedirectForRole', () => {
  it('sends productora to /laboratorio', () => {
    expect(getDefaultRedirectForRole(ROLES.PRODUCTORA)).toBe('/laboratorio');
  });

  it('sends admin to /admin', () => {
    expect(getDefaultRedirectForRole(ROLES.ADMIN)).toBe('/admin');
  });

  it('sends suscriptora to / when there is no callbackUrl context', () => {
    expect(getDefaultRedirectForRole(ROLES.SUSCRIPTORA)).toBe('/');
  });

  it('falls back to / for missing roles', () => {
    expect(getDefaultRedirectForRole(undefined)).toBe('/');
  });

  it('falls back to / for unknown roles', () => {
    expect(getDefaultRedirectForRole('unknown')).toBe('/');
  });
});

describe('DEFAULT_REDIRECTS', () => {
  it('exposes the three role destinations', () => {
    expect(DEFAULT_REDIRECTS.PRODUCTORA).toBe('/laboratorio');
    expect(DEFAULT_REDIRECTS.ADMIN).toBe('/admin');
    expect(DEFAULT_REDIRECTS.SUSCRIPTORA).toBe('/');
  });
});

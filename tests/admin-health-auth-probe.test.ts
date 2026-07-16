import { afterEach, describe, expect, it } from 'vitest';
import { checkAuthHealth } from '@/lib/admin/health/probes/auth';

const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

afterEach(() => {
  process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  process.env.GOOGLE_CLIENT_SECRET = originalGoogleClientSecret;
});

describe('checkAuthHealth', () => {
  it('reports static provider and JWT capabilities without reading user sessions', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    await expect(checkAuthHealth()).resolves.toEqual({
      state: 'ready',
      details: {
        credentialsProviderConfigured: true,
        googleProviderConfigured: false,
        jwtSessionStrategy: true,
      },
    });
  });

  it('recognizes Google capability only when both configuration values are present', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

    await expect(checkAuthHealth()).resolves.toEqual({
      state: 'ready',
      details: {
        credentialsProviderConfigured: true,
        googleProviderConfigured: true,
        jwtSessionStrategy: true,
      },
    });
  });
});

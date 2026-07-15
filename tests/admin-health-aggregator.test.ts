import { describe, expect, it, vi } from 'vitest';

const { applicationProbe, mongoProbe, authProbe } = vi.hoisted(() => ({
  applicationProbe: vi.fn(),
  mongoProbe: vi.fn(),
  authProbe: vi.fn(),
}));

vi.mock('@/lib/admin/health/probes/application', () => ({ checkApplicationHealth: applicationProbe }));
vi.mock('@/lib/admin/health/probes/mongo', () => ({ checkMongoHealth: mongoProbe }));
vi.mock('@/lib/admin/health/probes/auth', () => ({ checkAuthHealth: authProbe }));

import { getHealthReport } from '@/lib/admin/health';

describe('getHealthReport', () => {
  it('returns the exact safe report shape from all readiness probes', async () => {
    applicationProbe.mockResolvedValue({
      state: 'ready',
      details: { routeImportsResolved: true, adminLayoutResolved: true },
    });
    mongoProbe.mockResolvedValue({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: true },
    });
    authProbe.mockResolvedValue({
      state: 'ready',
      details: {
        credentialsProviderConfigured: true,
        googleProviderConfigured: false,
        jwtSessionStrategy: true,
      },
    });

    const report = await getHealthReport();

    expect(report).toEqual({
      generatedAt: expect.any(String),
      application: {
        state: 'ready',
        details: { routeImportsResolved: true, adminLayoutResolved: true },
      },
      mongo: {
        state: 'ready',
        details: { pingReachedServer: true, authenticated: true },
      },
      auth: {
        state: 'ready',
        details: {
          credentialsProviderConfigured: true,
          googleProviderConfigured: false,
          jwtSessionStrategy: true,
        },
      },
    });
    expect(Number.isNaN(Date.parse(report.generatedAt))).toBe(false);
  });

  it('collapses a throwing probe to an unavailable report without an error value', async () => {
    applicationProbe.mockRejectedValue(new Error('mongodb://user:password@internal-host'));
    mongoProbe.mockResolvedValue({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: true },
    });
    authProbe.mockResolvedValue({
      state: 'ready',
      details: {
        credentialsProviderConfigured: true,
        googleProviderConfigured: false,
        jwtSessionStrategy: true,
      },
    });

    const report = await getHealthReport();

    expect(report.application).toEqual({
      state: 'unavailable',
      details: { routeImportsResolved: false, adminLayoutResolved: false },
    });
    expect(JSON.stringify(report)).not.toContain('mongodb://user:password@internal-host');
    expect(JSON.stringify(report)).not.toContain('error');
  });
});

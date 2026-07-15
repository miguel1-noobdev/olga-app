import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getHealthReportMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getHealthReportMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/admin/health', () => ({ getHealthReport: getHealthReportMock }));

import { GET } from '@/app/api/admin/health/route';

describe('GET /api/admin/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without a session and never invokes a health probe', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(getHealthReportMock).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin sessions and the exact safe report for Admin', async () => {
    getServerSessionMock.mockResolvedValue({ user: { role: 'suscriptora' } });
    const denied = await GET();
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: 'Forbidden' });

    const report = {
      generatedAt: '2026-07-15T20:00:00.000Z',
      application: { state: 'ready', details: { routeImportsResolved: true, adminLayoutResolved: true } },
      mongo: { state: 'ready', details: { pingReachedServer: true, authenticated: true } },
      auth: {
        state: 'ready',
        details: { credentialsProviderConfigured: true, googleProviderConfigured: false, jwtSessionStrategy: true },
      },
    };
    getServerSessionMock.mockResolvedValue({ user: { role: 'admin' } });
    getHealthReportMock.mockResolvedValue(report);

    const allowed = await GET();

    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual(report);
  });
});

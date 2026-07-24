import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { checkMongoHealthMock, getCurrentUserMock, getServerSessionMock } = vi.hoisted(() => ({
  checkMongoHealthMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  getServerSessionMock: vi.fn(),
}));

vi.mock('@/lib/admin/health/probes/mongo', () => ({
  checkMongoHealth: checkMongoHealthMock,
}));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));

import { GET as getLive } from '@/app/api/health/live/route';
import { GET as getReady, dynamic as readyDynamic } from '@/app/api/health/ready/route';

describe('public health endpoints', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_SECRET', 'runtime-secret');
    vi.stubEnv('MONGODB_URI', 'mongodb://user:password@mongo.internal/botanica-ob');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the exact uncached liveness contract without auth or Mongo calls', async () => {
    const response = await getLive();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(getServerSessionMock).not.toHaveBeenCalled();
    expect(checkMongoHealthMock).not.toHaveBeenCalled();
  });

  it('opts the readiness route out of static optimization', () => {
    expect(readyDynamic).toBe('force-dynamic');
  });

  it('returns ready only when required configuration and MongoDB pass', async () => {
    checkMongoHealthMock.mockResolvedValue({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: true },
    });

    const response = await getReady();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ready' });
    expect(checkMongoHealthMock).toHaveBeenCalledWith(1000);
  });

  it('rejects missing required configuration without probing MongoDB', async () => {
    delete process.env.MONGODB_URI;

    const response = await getReady();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
    expect(checkMongoHealthMock).not.toHaveBeenCalled();
  });

  it('rejects missing runtime authentication configuration without probing MongoDB', async () => {
    delete process.env.NEXTAUTH_SECRET;

    const response = await getReady();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
    expect(checkMongoHealthMock).not.toHaveBeenCalled();
  });

  it('returns the safe unavailable contract when MongoDB rejects', async () => {
    checkMongoHealthMock.mockRejectedValue(
      new Error('mongodb://user:password@mongo.internal/botanica-ob')
    );

    const response = await getReady();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body).toEqual({ status: 'unavailable' });
    expect(JSON.stringify(body)).not.toContain('mongodb://');
    expect(JSON.stringify(body)).not.toContain('password');
    expect(JSON.stringify(body)).not.toContain('mongo.internal');
  });

  it('returns unavailable when the bounded Mongo probe reports failure', async () => {
    checkMongoHealthMock.mockResolvedValue({
      state: 'unavailable',
      details: { pingReachedServer: false, authenticated: false },
    });

    const response = await getReady();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });
});

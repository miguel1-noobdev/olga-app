import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { checkMongoHealthMock } = vi.hoisted(() => ({
  checkMongoHealthMock: vi.fn(),
}));

vi.mock('@/lib/admin/health/probes/mongo', () => ({
  checkMongoHealth: checkMongoHealthMock,
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns only a safe success result when authenticated Mongo is ready', async () => {
    checkMongoHealthMock.mockResolvedValue({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: true },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toEqual({ status: 'ok' });
    expect(JSON.stringify(body)).not.toMatch(/details|authenticated|mongodb|secret|password|role/i);
  });

  it('returns a safe 503 result when Mongo is unavailable', async () => {
    checkMongoHealthMock.mockResolvedValue({
      state: 'unavailable',
      details: { pingReachedServer: false, authenticated: false },
    });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });

  it('does not report readiness when the Mongo ping is not authenticated', async () => {
    checkMongoHealthMock.mockResolvedValue({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: false },
    });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });

  it('does not disclose dependency errors', async () => {
    checkMongoHealthMock.mockRejectedValue(new Error('mongodb://user:password@internal-host:27017/db'));

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toBe('{"status":"unavailable"}');
    expect(body).not.toContain('password');
    expect(body).not.toContain('internal-host');
  });

  it('returns a bounded 503 when the dependency probe hangs', async () => {
    vi.useFakeTimers();
    checkMongoHealthMock.mockReturnValue(new Promise(() => {}));

    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(1000);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });
});

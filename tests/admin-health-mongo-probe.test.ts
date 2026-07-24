import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mongoClientMock, mongooseConnectMock } = vi.hoisted(() => ({
  mongoClientMock: vi.fn(),
  mongooseConnectMock: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: mongooseConnectMock,
    mongo: { MongoClient: mongoClientMock },
  },
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.stubEnv('MONGODB_URI', 'mongodb://health-user:health-password@mongo.test/botanica-ob?authSource=admin');
});

describe('checkMongoHealth', () => {
  it('reports ready only after an isolated MongoDB client responds to ping', async () => {
    const ping = vi.fn().mockResolvedValue({ ok: 1 });
    const close = vi.fn().mockResolvedValue(undefined);
    const connect = vi.fn().mockResolvedValue(undefined);
    mongoClientMock.mockImplementation(() => ({
      connect,
      close,
      db: () => ({ admin: () => ({ ping }) }),
    }));
    const { checkMongoHealth } = await import('@/lib/admin/health/probes/mongo');

    await expect(checkMongoHealth()).resolves.toEqual({
      state: 'ready',
      details: { pingReachedServer: true, authenticated: true },
    });
    expect(ping).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(mongooseConnectMock).not.toHaveBeenCalled();
  });

  it('does not poison application connectivity after the isolated MongoDB client fails', async () => {
    const applicationConnection = { connection: {} };
    mongoClientMock.mockImplementation(() => ({
      connect: vi.fn().mockRejectedValue(new Error('connection failed')),
      close: vi.fn().mockResolvedValue(undefined),
    }));
    mongooseConnectMock.mockResolvedValue(applicationConnection);
    const { checkMongoHealth } = await import('@/lib/admin/health/probes/mongo');
    const { connectToDatabase } = await import('@/lib/db/connect');

    await expect(checkMongoHealth()).resolves.toEqual({
      state: 'unavailable',
      details: { pingReachedServer: false, authenticated: false },
    });
    await expect(connectToDatabase()).resolves.toBe(applicationConnection);
    expect(mongooseConnectMock).toHaveBeenCalledTimes(1);
  });

  it('does not poison application connectivity when the health probe times out', async () => {
    const applicationConnection = { connection: {} };
    mongoClientMock.mockImplementation(() => ({
      connect: () => new Promise(() => {}),
      close: vi.fn().mockResolvedValue(undefined),
    }));
    mongooseConnectMock.mockResolvedValue(applicationConnection);
    const { checkMongoHealth } = await import('@/lib/admin/health/probes/mongo');
    const { connectToDatabase } = await import('@/lib/db/connect');

    await expect(checkMongoHealth(1)).resolves.toEqual({
      state: 'unavailable',
      details: { pingReachedServer: false, authenticated: false },
    });
    expect(mongoClientMock).toHaveBeenCalledWith(expect.any(String), {
      serverSelectionTimeoutMS: 1,
    });
    expect((mongoClientMock.mock.results[0].value as { close: ReturnType<typeof vi.fn> }).close)
      .toHaveBeenCalledTimes(1);
    await expect(connectToDatabase()).resolves.toBe(applicationConnection);
    expect(mongooseConnectMock).toHaveBeenCalledTimes(1);
  });
});

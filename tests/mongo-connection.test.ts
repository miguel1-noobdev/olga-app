import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mongooseConnectMock } = vi.hoisted(() => ({
  mongooseConnectMock: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connect: mongooseConnectMock,
  },
}));

const originalMongoUri = process.env.MONGODB_URI;

beforeEach(() => {
  mongooseConnectMock.mockReset();
  process.env.MONGODB_URI = 'mongodb://example.test/botanica-ob';
});

afterEach(() => {
  vi.resetModules();

  if (originalMongoUri === undefined) {
    delete process.env.MONGODB_URI;
  } else {
    process.env.MONGODB_URI = originalMongoUri;
  }
});

describe('MongoDB connection', () => {
  it('uses bounded Mongoose connection timeouts', async () => {
    const mongooseInstance = { connection: { readyState: 1 } };
    mongooseConnectMock.mockResolvedValue(mongooseInstance);
    const { connectToDatabase } = await import('@/lib/db/connect');

    await expect(connectToDatabase()).resolves.toBe(mongooseInstance);

    expect(mongooseConnectMock).toHaveBeenCalledWith(
      'mongodb://example.test/botanica-ob',
      {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      }
    );
  });

  it('retries after a rejected connection attempt instead of reusing the rejection', async () => {
    const firstError = new Error('simulated connection failure');
    const mongooseInstance = { connection: { readyState: 1 } };
    mongooseConnectMock
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce(mongooseInstance);
    const { connectToDatabase } = await import('@/lib/db/connect');

    await expect(connectToDatabase()).rejects.toBe(firstError);
    await expect(connectToDatabase()).resolves.toBe(mongooseInstance);

    expect(mongooseConnectMock).toHaveBeenCalledTimes(2);
  });

  it('reuses a successful connection without reconnecting', async () => {
    const mongooseInstance = { connection: { readyState: 1 } };
    mongooseConnectMock.mockResolvedValue(mongooseInstance);
    const { connectToDatabase } = await import('@/lib/db/connect');

    const firstConnection = await connectToDatabase();
    const secondConnection = await connectToDatabase();

    expect(secondConnection).toBe(firstConnection);
    expect(mongooseConnectMock).toHaveBeenCalledTimes(1);
  });
});

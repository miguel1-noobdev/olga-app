import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';

const { connectToDatabaseMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

describe('authOptions Google signIn callback', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    connectToDatabaseMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates a new Google user as suscriptora even when the database is empty', async () => {
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;

    const result = await signIn({
      user: { email: 'first@example.com', name: 'First User' },
      account: { provider: 'google', type: 'oauth' },
    } as any);

    expect(result).toBe(true);

    const dbUser = await createUserRepository().findByEmail('first@example.com');
    expect(dbUser).not.toBeNull();
    expect(dbUser!.role).toBe('suscriptora');
  });

  it('does not change the role of an existing user when they sign in with Google', async () => {
    const repo = createUserRepository();
    await repo.create({
      email: 'existing@example.com',
      password: 'secret123',
      role: 'admin',
    });

    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;

    const result = await signIn({
      user: { email: 'existing@example.com', name: 'Existing' },
      account: { provider: 'google', type: 'oauth' },
    } as any);

    expect(result).toBe(true);

    const dbUser = await repo.findByEmail('existing@example.com');
    expect(dbUser!.role).toBe('admin');
  });

  it('does not create a user for non-Google providers', async () => {
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;

    const result = await signIn({
      user: { email: 'other@example.com', name: 'Other' },
      account: { provider: 'credentials', type: 'credentials' },
    } as any);

    expect(result).toBe(true);

    const dbUser = await createUserRepository().findByEmail('other@example.com');
    expect(dbUser).toBeNull();
  });
});

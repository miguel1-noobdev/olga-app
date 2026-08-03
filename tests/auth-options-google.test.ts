import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';
import { IdentityModel } from '@/lib/db/models/identity';

const { connectToDatabaseMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
}));

const originalGoogleOAuthEnabled = process.env.GOOGLE_OAUTH_ENABLED;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

describe('authOptions Google signIn callback', () => {
  let mongoServer: MongoMemoryServer;

  function enableGoogle() {
    process.env.GOOGLE_OAUTH_ENABLED = 'true';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  }

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    connectToDatabaseMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    for (const [key, value] of [
      ['GOOGLE_OAUTH_ENABLED', originalGoogleOAuthEnabled],
      ['GOOGLE_CLIENT_ID', originalGoogleClientId],
      ['GOOGLE_CLIENT_SECRET', originalGoogleClientSecret],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('denies a Google callback when the provider is disabled', async () => {
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;

    const result = await signIn({
      user: { email: 'first@example.com', name: 'First User' },
      account: { provider: 'google', type: 'oauth' },
    } as any);

    expect(result).toBe(false);

    const dbUser = await createUserRepository().findByEmail('first@example.com');
    expect(dbUser).toBeNull();
  });

  it('denies email-only matching without explicit linking', async () => {
    enableGoogle();
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

    expect(result).toBe(false);

    const dbUser = await repo.findByEmail('existing@example.com');
    expect(dbUser!.role).toBe('admin');
  });

  it('signs in an existing identity without changing its role', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const user = await repo.create({
      email: 'linked@example.com',
      password: 'secret123',
      role: 'admin',
    });
    await IdentityModel.create({
      accountId: user.id,
      provider: 'google',
      providerAccountId: 'google-linked',
      email: user.email,
    });

    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const googleUser = { email: user.email };

    const result = await signIn({
      user: googleUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'google-linked' },
      profile: { email: user.email, email_verified: true },
    } as any);

    expect(result).toBe(true);
    expect(googleUser).toMatchObject({ id: user.id, role: 'admin' });
    expect((await repo.findById(user.id))!.role).toBe('admin');
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

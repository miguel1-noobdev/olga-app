import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';
import { IdentityModel } from '@/lib/db/models/identity';
import { GOOGLE_CREDENTIALS_FALLBACK } from '@/lib/auth/google';

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

  it.each(['suscriptora', 'productora', 'admin'] as const)(
    'denies a credentials collision for %s without any OAuth mutation',
    async (role) => {
      enableGoogle();
      const repo = createUserRepository();
      const existingUser = await repo.create({
        email: 'existing@example.com',
        password: 'secret123',
        role,
      });

      const { authOptions } = await import('@/lib/auth/options');
      const signIn = authOptions.callbacks!.signIn!;
      const googleUser = { email: existingUser.email };
      const usersBefore = await repo.findAll();
      const identitiesBefore = await IdentityModel.countDocuments();

      const result = await signIn({
        user: googleUser,
        account: { provider: 'google', type: 'oauth', providerAccountId: `collision-${role}` },
        profile: { email: existingUser.email, email_verified: true },
      } as any);

      expect(result).toBe('/login?error=GOOGLE_CREDENTIALS_FALLBACK');
      expect(GOOGLE_CREDENTIALS_FALLBACK).toBe(
        'No pudimos completar el acceso con Google. Iniciá sesión con tu email y contraseña.',
      );
      expect(googleUser).toEqual({ email: existingUser.email });

      expect(await repo.findAll()).toEqual(usersBefore);
      expect(await IdentityModel.countDocuments()).toBe(identitiesBefore);
    },
  );

  it('creates a verified Google profile only as a new subscriber', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const googleUser = { email: 'new-google@example.com' };

    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const result = await signIn({
      user: googleUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'new-google' },
      profile: { email: 'new-google@example.com', email_verified: true },
    } as any);

    expect(result).toBe(true);
    expect(googleUser).toMatchObject({ role: 'suscriptora', emailVerified: true });
    expect(await repo.findByEmail('new-google@example.com')).toMatchObject({
      role: 'suscriptora',
      accountStatus: 'active',
      emailVerified: true,
    });
    expect(await IdentityModel.countDocuments({ providerAccountId: 'new-google' })).toBe(1);
  });

  it('signs in an existing identity without changing its role', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const user = await repo.create({
      email: 'linked@example.com',
      password: 'secret123',
      role: 'suscriptora',
    });
    await IdentityModel.create({
      accountId: user.id,
      provider: 'google',
      providerAccountId: 'google-linked',
      email: user.email,
    });

    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const googleUser = { email: 'different-google-email@example.com' };

    const result = await signIn({
      user: googleUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'google-linked' },
      profile: { email: 'different-google-email@example.com', email_verified: true },
    } as any);

    expect(result).toBe(true);
    expect(googleUser).toMatchObject({ id: user.id, role: 'suscriptora' });
    expect((await repo.findById(user.id))!.role).toBe('suscriptora');
  });

  it('denies an existing Google identity owned by staff without changing the account', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const user = await repo.create({
      email: 'staff-linked@example.com',
      password: 'secret123',
      role: 'productora',
    });
    await IdentityModel.create({
      accountId: user.id,
      provider: 'google',
      providerAccountId: 'staff-linked',
      email: user.email,
    });

    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const googleUser = { email: user.email };

    const result = await signIn({
      user: googleUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'staff-linked' },
      profile: { email: user.email, email_verified: true },
    } as any);

    expect(result).toBe(false);
    expect(googleUser).toEqual({ email: user.email });
    expect((await repo.findById(user.id))!.role).toBe('productora');
    expect(await IdentityModel.countDocuments({ accountId: user.id })).toBe(1);
  });

  it('keeps one subscriber and one identity when provider callbacks race', async () => {
    enableGoogle();
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const repo = createUserRepository();
    const providerAccountId = 'racing-provider-id';

    const results = await Promise.all([
      signIn({
        user: { email: 'race-one@example.com' },
        account: { provider: 'google', type: 'oauth', providerAccountId },
        profile: { email: 'race-one@example.com', email_verified: true },
      } as any),
      signIn({
        user: { email: 'race-two@example.com' },
        account: { provider: 'google', type: 'oauth', providerAccountId },
        profile: { email: 'race-two@example.com', email_verified: true },
      } as any),
    ]);

    expect(results).toHaveLength(2);
    expect(results).toContain(true);
    expect(await IdentityModel.countDocuments({ provider: 'google', providerAccountId })).toBe(1);
    expect(await repo.findAll()).toHaveLength(1);
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

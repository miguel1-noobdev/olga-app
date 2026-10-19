import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';
import { IdentityModel } from '@/lib/db/models/identity';
import { UserModel } from '@/lib/db/models/user';

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
    vi.restoreAllMocks();
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

  it('denies a Google callback when index readiness fails before account writes', async () => {
    enableGoogle();
    const repo = createUserRepository();
    vi.spyOn(IdentityModel, 'init').mockRejectedValueOnce(new Error('identity indexes unavailable'));

    const attempt = await signInWithGoogle('readiness@example.com', 'google-readiness');

    expect(attempt.result).toBe(false);
    expect(attempt.user).toEqual({ email: 'readiness@example.com' });
    expect(await repo.count()).toBe(0);
    expect(await repo.findByEmail('readiness@example.com')).toBeNull();
    expect(await IdentityModel.countDocuments()).toBe(0);
  });

  it('returns an account-in-use redirect without linking an existing credentials account', async () => {
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
      account: {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google-existing',
      },
      profile: { email: 'existing@example.com', email_verified: true },
    } as any);

    expect(result).toBe('/login?error=AccountInUse');

    const dbUser = await repo.findByEmail('existing@example.com');
    expect(dbUser!.role).toBe('admin');
    expect(await IdentityModel.countDocuments()).toBe(0);
  });

  it('signs in an existing identity without changing its role or security version', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const user = await repo.create({
      email: 'linked@example.com',
      password: 'secret123',
      role: 'admin',
    });
    await repo.advanceSecurityVersion(user.id);
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
    expect(googleUser).toMatchObject({
      id: user.id,
      role: 'admin',
      emailVerified: true,
      securityVersion: 1,
    });
    expect(await repo.findById(user.id)).toMatchObject({
      role: 'admin',
      accountStatus: 'active',
      emailVerified: true,
      securityVersion: 1,
    });
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

  it('denies a failed identity reservation before user creation and lets the same subject retry', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const createIdentity = vi.spyOn(IdentityModel, 'create').mockRejectedValueOnce(
      new Error('identity reservation failed'),
    );

    const firstAttempt = await signInWithGoogle('retry@example.com', 'google-retry');

    expect(firstAttempt.result).toBe(false);
    expect(firstAttempt.user).toEqual({ email: 'retry@example.com' });
    expect(await repo.count()).toBe(0);
    expect(await repo.findByEmail('retry@example.com')).toBeNull();

    createIdentity.mockRestore();
    const retry = await signInWithGoogle('retry@example.com', 'google-retry');

    expect(retry.result).toBe(true);
    expect(retry.user).toMatchObject({
      email: 'retry@example.com',
      role: 'suscriptora',
      emailVerified: true,
      securityVersion: 0,
    });
    expect(await repo.count()).toBe(1);
    expect(await repo.findByEmail('retry@example.com')).toMatchObject({
      accountStatus: 'active',
      emailVerified: true,
    });
  });

  it.each([
    ['identity reservation', IdentityModel, 'create', 0, null],
    ['account creation', UserModel, 'create', 1, { accountStatus: 'pending_email', emailVerified: false }],
    ['user promotion', UserModel, 'findOneAndUpdate', 1, { accountStatus: 'active', emailVerified: true }],
    ['identity finalization', IdentityModel, 'findOneAndUpdate', 1, { accountStatus: 'active', emailVerified: true }],
  ] as const)(
    'denies a lost acknowledgement after %s and converges on same-subject retry',
    async (_boundary, model, method, expectedCount, expectedUser) => {
      enableGoogle();
      const repo = createUserRepository();
      const failure = throwAfterCommittedModelWrite(model, method, 'write acknowledgement lost');

      const firstAttempt = await signInWithGoogle('ambiguous@example.com', 'google-ambiguous');

      expect(firstAttempt.result).toBe(false);
      expect(firstAttempt.user).toEqual({ email: 'ambiguous@example.com' });
      expect(await repo.count()).toBe(expectedCount);
      if (expectedUser === null) {
        expect(await repo.findByEmail('ambiguous@example.com')).toBeNull();
      } else {
        expect(await repo.findByEmail('ambiguous@example.com')).toMatchObject(expectedUser);
      }

      failure.mockRestore();
      const retry = await signInWithGoogle('ambiguous@example.com', 'google-ambiguous');

      expect(retry.result).toBe(true);
      expect(retry.user).toMatchObject({
        email: 'ambiguous@example.com',
        role: 'suscriptora',
        emailVerified: true,
        securityVersion: 0,
      });
      expect(await repo.count()).toBe(1);
      expect(await repo.findByEmail('ambiguous@example.com')).toMatchObject({
        accountStatus: 'active',
        emailVerified: true,
        role: 'suscriptora',
        securityVersion: 0,
      });
    },
  );

  it('converges concurrent callbacks for one Google subject on one active subscriber', async () => {
    enableGoogle();
    const repo = createUserRepository();

    const attempts = await Promise.all([
      signInWithGoogle('concurrent@example.com', 'google-concurrent'),
      signInWithGoogle('concurrent@example.com', 'google-concurrent'),
    ]);
    const identities = await IdentityModel.find({
      provider: 'google',
      providerAccountId: 'google-concurrent',
    });
    const storedUser = await repo.findByEmail('concurrent@example.com');

    expect(identities).toHaveLength(1);
    expect(identities[0]).toMatchObject({
      accountId: storedUser!.id,
      provisioningState: 'active',
    });
    expect(attempts.map(({ result }) => result)).toEqual([true, true]);
    expect(attempts.map(({ user }) => user.id)).toEqual([attempts[0].user.id, attempts[0].user.id]);
    expect(await repo.count()).toBe(1);
    expect(await repo.findByEmail('concurrent@example.com')).toMatchObject({
      id: attempts[0].user.id,
      role: 'suscriptora',
      accountStatus: 'active',
      emailVerified: true,
      securityVersion: 0,
    });

    const retry = await signInWithGoogle('concurrent@example.com', 'google-concurrent');
    expect(retry.result).toBe(true);
    expect(retry.user.id).toBe(attempts[0].user.id);
    expect(await repo.count()).toBe(1);
  });

  it.each(['missing', 'suspended', 'unverified'] as const)(
    'denies a legacy Google identity whose account is %s without recreating or changing it',
    async (state) => {
      enableGoogle();
      const repo = createUserRepository();
      const email = `${state}@example.com`;
      let accountId = new mongoose.Types.ObjectId().toString();
      let expectedCount = 0;

      if (state !== 'missing') {
        const account = await repo.create({
          email,
          password: 'secret123',
          role: 'productora',
          accountStatus: state === 'unverified' ? 'pending_email' : 'active',
          emailVerified: state !== 'unverified',
        });
        accountId = account.id;
        expectedCount = 1;
        if (state === 'suspended') {
          await repo.updateAccountStatus(accountId, 'suspended');
        } else {
          await repo.updateAccountStatus(accountId, 'active');
        }
      }

      await IdentityModel.create({
        accountId,
        provider: 'google',
        providerAccountId: `google-${state}`,
        email,
      });
      const before = state === 'missing' ? null : await repo.findById(accountId);

      const attempt = await signInWithGoogle(email, `google-${state}`);

      expect(attempt.result).toBe(false);
      expect(attempt.user).toEqual({ email });
      expect(await repo.count()).toBe(expectedCount);
      expect(await repo.findById(accountId)).toEqual(before);
      expect(await repo.findByEmail(email)).toEqual(before);
    },
  );

  it('does not activate an ineligible account owned by a pending reservation', async () => {
    enableGoogle();
    const repo = createUserRepository();
    const account = await repo.create({
      email: 'pending-suspended@example.com',
      password: 'secret123',
      role: 'productora',
    });
    await repo.updateAccountStatus(account.id, 'suspended');
    await repo.advanceSecurityVersion(account.id);
    await IdentityModel.create({
      accountId: account.id,
      provider: 'google',
      providerAccountId: 'google-pending-suspended',
      email: account.email,
      provisioningState: 'pending',
    } as never);

    const attempt = await signInWithGoogle(account.email, 'google-pending-suspended');

    expect(attempt.result).toBe(false);
    expect(attempt.user).toEqual({ email: account.email });
    expect(await repo.findById(account.id)).toMatchObject({
      role: 'productora',
      accountStatus: 'suspended',
      emailVerified: true,
      securityVersion: 1,
    });
    expect(await repo.count()).toBe(1);
  });
});

async function signInWithGoogle(email: string, providerAccountId: string) {
  const { authOptions } = await import('@/lib/auth/options');
  const user: { email: string; [key: string]: unknown } = { email };
  const result = await authOptions.callbacks!.signIn!({
    user,
    account: { provider: 'google', type: 'oauth', providerAccountId },
    profile: { email, email_verified: true },
  } as never);
  return { result, user };
}

function throwAfterCommittedModelWrite(
  model: object,
  method: string,
  message: string,
) {
  const target = model as Record<string, (...args: unknown[]) => unknown>;
  const original = target[method].bind(model);

  return vi.spyOn(target, method).mockImplementationOnce((...args: unknown[]) => (
    Promise.resolve(original(...args)).then(() => {
      throw new Error(message);
    })
  ) as never);
}

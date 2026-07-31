import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  AuthTokenModel,
  consumeAuthToken,
  hashAuthToken,
} from '@/lib/db/models/auth-token';
import { AuthEventModel } from '@/lib/db/models/auth-event';
import { IdentityModel } from '@/lib/db/models/identity';
import { RateLimitModel } from '@/lib/db/models/rate-limit';
import { createUserRepository } from '@/lib/db/repository/user';
import { UserModel } from '@/lib/db/models/user';
import {
  assertReceiptApprovedForApply,
  createDryRunReceipt,
  type MigrationUserSnapshot,
} from '../../scripts/identity-migration';

describe('auth token primitives', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    await AuthTokenModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('hashes a raw token with a one-way SHA-256 digest', () => {
    const rawToken = 'verification-token-value';

    expect(hashAuthToken(rawToken)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashAuthToken(rawToken)).not.toContain(rawToken);
    expect(hashAuthToken(rawToken)).toBe(hashAuthToken(rawToken));
  });

  it('rejects a token after its expiry even when the hash and purpose match', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const rawToken = 'expired-token';

    await AuthTokenModel.create({
      accountId: 'account-1',
      purpose: 'email_verification',
      tokenHash: hashAuthToken(rawToken),
      expiresAt: new Date('2026-07-31T11:59:59.000Z'),
    });

    expect(await consumeAuthToken({
      accountId: 'account-1',
      purpose: 'email_verification',
      rawToken,
      now,
    })).toBe(false);
  });

  it('consumes a valid token once and rejects its replay', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const rawToken = 'single-use-token';

    await AuthTokenModel.create({
      accountId: 'account-1',
      purpose: 'password_reset',
      tokenHash: hashAuthToken(rawToken),
      expiresAt: new Date('2026-07-31T13:00:00.000Z'),
    });

    const firstUse = await consumeAuthToken({
      accountId: 'account-1',
      purpose: 'password_reset',
      rawToken,
      now,
    });
    const replay = await consumeAuthToken({
      accountId: 'account-1',
      purpose: 'password_reset',
      rawToken,
      now: new Date('2026-07-31T12:01:00.000Z'),
    });

    expect(firstUse).toBe(true);
    expect(replay).toBe(false);
  });

  it('atomically permits only one concurrent claimant to consume a token', async () => {
    const now = new Date('2026-07-31T12:00:00.000Z');
    const rawToken = 'concurrent-token';

    await AuthTokenModel.create({
      accountId: 'account-1',
      purpose: 'google_link',
      tokenHash: hashAuthToken(rawToken),
      expiresAt: new Date('2026-07-31T13:00:00.000Z'),
    });

    const results = await Promise.all([
      consumeAuthToken({
        accountId: 'account-1',
        purpose: 'google_link',
        rawToken,
        now,
      }),
      consumeAuthToken({
        accountId: 'account-1',
        purpose: 'google_link',
        rawToken,
        now,
      }),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.filter((result) => !result)).toHaveLength(1);
  });

  it('round-trips pending status and advances the persisted security version', async () => {
    const repo = createUserRepository();
    const user = await repo.create({
      email: 'pending@example.test',
      password: 'secret123',
      accountStatus: 'pending_email',
      emailVerified: false,
    });

    expect(user.accountStatus).toBe('pending_email');
    expect(user.emailVerified).toBe(false);
    expect(user.securityVersion).toBe(0);

    await repo.advanceSecurityVersion(user.id);

    expect((await repo.findById(user.id))?.securityVersion).toBe(1);
  });
});

describe('identity migration dry-run', () => {
  const legacyUsers: MigrationUserSnapshot[] = [
    {
      id: 'legacy-admin',
      email: 'admin@example.test',
      role: 'admin',
    },
    {
      id: 'existing-productora',
      email: 'olga@example.test',
      role: 'productora',
      accountStatus: 'active',
      securityVersion: 3,
    },
  ];

  it('reports missing lifecycle fields without mutating legacy roles or snapshots', () => {
    const before = structuredClone(legacyUsers);
    const receipt = createDryRunReceipt(legacyUsers, new Date('2026-07-31T12:00:00.000Z'));

    expect(receipt.mode).toBe('dry-run');
    expect(receipt.proposedChanges).toEqual([
      {
        id: 'legacy-admin',
        role: 'admin',
        accountStatus: 'active',
        securityVersion: 0,
      },
    ]);
    expect(receipt.rolePreservation).toBe(true);
    expect(legacyUsers).toEqual(before);
  });

  it('forbids applying a dry-run receipt before review and explicit sign-off', () => {
    const receipt = createDryRunReceipt(
      legacyUsers,
      new Date('2026-07-31T12:00:00.000Z'),
    );

    expect(() => assertReceiptApprovedForApply(receipt)).toThrow(
      'Identity migration apply requires reviewed dry-run receipt and explicit sign-off.',
    );
    expect(() => assertReceiptApprovedForApply(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date('2026-07-31T13:00:00.000Z'),
    })).not.toThrow();
  });
});

describe('identity foundation models', () => {
  it('preserves lifecycle defaults and the persisted security version', () => {
    const accountStatus = UserModel.schema.path('accountStatus');
    const securityVersion = UserModel.schema.path('securityVersion');

    expect(accountStatus.options.enum).toContain('pending_email');
    expect(accountStatus.options.default).toBe('active');
    expect(securityVersion.options.default).toBe(0);
  });

  it('defines unique provider identity and durable security record indexes', () => {
    expect(IdentityModel.schema.indexes()).toContainEqual([
      { provider: 1, providerAccountId: 1 },
      { unique: true },
    ]);
    expect(RateLimitModel.schema.indexes()).toContainEqual([
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    ]);
    expect(AuthEventModel.schema.path('event').options.required).toBe(true);
  });
});

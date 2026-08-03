import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet, MongoMemoryServer } from 'mongodb-memory-server';
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
  applyIdentityMigration,
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
  let migrationMongoServer: MongoMemoryReplSet;

  beforeAll(async () => {
    migrationMongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(migrationMongoServer.getUri());
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await UserModel.deleteMany({});
    await AuthEventModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await migrationMongoServer.stop();
  });

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

  function legacyUser(
    id: mongoose.Types.ObjectId,
    role: MigrationUserSnapshot['role'],
    lifecycle: Record<string, unknown> = {},
  ) {
    return { _id: id, email: `${id}@example.test`, passwordHash: 'legacy-hash', role, createdAt: new Date(), ...lifecycle };
  }

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

  it('proposes only missing lifecycle fields without overwriting persisted safeguards', () => {
    const receipt = createDryRunReceipt([
      { id: 'suspended-user', email: 'suspended@example.test', role: 'suscriptora', accountStatus: 'suspended' },
      { id: 'secured-user', email: 'secured@example.test', role: 'productora', securityVersion: 7 },
    ]);

    expect(receipt.proposedChanges).toEqual([
      { id: 'suspended-user', role: 'suscriptora', securityVersion: 0 },
      { id: 'secured-user', role: 'productora', accountStatus: 'active' },
    ]);
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

  it('rejects a receipt changed after its reviewed digest was issued', () => {
    const receipt = createDryRunReceipt(
      legacyUsers,
      new Date('2026-07-31T12:00:00.000Z'),
    );
    receipt.proposedChanges[0].role = 'productora';

    expect(() => assertReceiptApprovedForApply(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date('2026-07-31T13:00:00.000Z'),
    })).toThrow('Identity migration receipt is invalid.');
  });

  it('applies only the reviewed changes while preserving every persisted role', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const productoraId = new mongoose.Types.ObjectId();
    await UserModel.collection.insertMany([
      {
        _id: adminId,
        email: 'legacy-admin@example.test',
        passwordHash: 'legacy-hash',
        role: 'admin',
        createdAt: new Date(),
      },
      {
        _id: productoraId,
        email: 'legacy-productora@example.test',
        passwordHash: 'legacy-hash',
        role: 'productora',
        createdAt: new Date(),
      },
    ]);
    const receipt = createDryRunReceipt([
      { id: adminId.toString(), email: 'legacy-admin@example.test', role: 'admin' },
      { id: productoraId.toString(), email: 'legacy-productora@example.test', role: 'productora' },
    ], new Date('2026-08-02T12:00:00.000Z'));

    const result = await applyIdentityMigration(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date('2026-08-02T13:00:00.000Z'),
    });

    expect(result).toMatchObject({
      mode: 'apply',
      receiptId: receipt.receiptId,
      rolePreservation: true,
    });
    expect(result.appliedChanges).toHaveLength(2);
    expect(await UserModel.findById(adminId)).toMatchObject({
      role: 'admin',
      accountStatus: 'active',
      securityVersion: 0,
    });
    expect(await UserModel.findById(productoraId)).toMatchObject({
      role: 'productora',
      accountStatus: 'active',
      securityVersion: 0,
    });
    expect(await AuthEventModel.findOne({ event: 'identity_migration', outcome: 'success' })).toMatchObject({
      metadata: { appliedChanges: 2, rolePreservation: true },
    });
  });

  it('preserves existing account status and security version during a partial migration', async () => {
    const suspendedId = new mongoose.Types.ObjectId();
    const securedId = new mongoose.Types.ObjectId();
    await UserModel.collection.insertMany([
      legacyUser(suspendedId, 'suscriptora', { accountStatus: 'suspended' }),
      legacyUser(securedId, 'productora', { securityVersion: 7 }),
    ]);
    const receipt = createDryRunReceipt([
      { id: suspendedId.toString(), email: 'suspended@example.test', role: 'suscriptora', accountStatus: 'suspended' },
      { id: securedId.toString(), email: 'secured@example.test', role: 'productora', securityVersion: 7 },
    ]);

    await applyIdentityMigration(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date(),
    });

    expect(await UserModel.collection.findOne({ _id: suspendedId })).toMatchObject({
      accountStatus: 'suspended',
      securityVersion: 0,
    });
    expect(await UserModel.collection.findOne({ _id: securedId })).toMatchObject({
      accountStatus: 'active',
      securityVersion: 7,
    });
  });

  it('rolls back lifecycle changes when audit recording fails', async () => {
    const firstId = new mongoose.Types.ObjectId();
    const secondId = new mongoose.Types.ObjectId();
    await UserModel.collection.insertMany([
      legacyUser(firstId, 'suscriptora'),
      legacyUser(secondId, 'productora'),
    ]);
    const receipt = createDryRunReceipt([
      { id: firstId.toString(), email: 'first@example.test', role: 'suscriptora' },
      { id: secondId.toString(), email: 'second@example.test', role: 'productora' },
    ]);
    vi.spyOn(AuthEventModel, 'create').mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(applyIdentityMigration(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date(),
    })).rejects.toThrow('audit unavailable');

    const users = await UserModel.collection.find({ _id: { $in: [firstId, secondId] } }).toArray();
    expect(users).toHaveLength(2);
    expect(users.every((user) => user.accountStatus === undefined && user.securityVersion === undefined)).toBe(true);
  });

  it('rejects a receipt whose role snapshot no longer matches the account', async () => {
    const productoraId = new mongoose.Types.ObjectId();
    await UserModel.collection.insertOne({
      _id: productoraId,
      email: 'legacy-productora@example.test',
      passwordHash: 'legacy-hash',
      role: 'productora',
      createdAt: new Date(),
    });
    const receipt = createDryRunReceipt([
      { id: productoraId.toString(), email: 'legacy-productora@example.test', role: 'admin' },
    ]);

    await expect(applyIdentityMigration(receipt, {
      receiptId: receipt.receiptId,
      approvedBy: 'admin@example.test',
      reviewedAt: new Date(),
    })).rejects.toThrow('Identity migration role guard failed');
    expect(await UserModel.findById(productoraId)).toMatchObject({ role: 'productora' });
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

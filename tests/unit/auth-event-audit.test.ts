import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthEventModel, recordAuthEvent } from '@/lib/db/models/auth-event';

describe('token-free authentication audit events', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(() => {
    return AuthEventModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('hashes identifiers and removes secrets from persisted audit data', async () => {
    await recordAuthEvent({
      accountId: 'account-1',
      event: 'password_reset',
      outcome: 'denied',
      email: 'Reader@Example.test',
      ip: '203.0.113.4',
      metadata: {
        reason: 'invalid-token',
        token: 'raw-reset-token',
        password: 'raw-password',
        attempts: 5,
      },
    });

    const event = await AuthEventModel.findOne({ event: 'password_reset' }).select('+emailHash +ipHash').lean();
    expect(event).toMatchObject({
      accountId: 'account-1',
      event: 'password_reset',
      outcome: 'denied',
      metadata: { reason: 'invalid-token', attempts: 5 },
    });
    expect(event?.emailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(event?.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(event)).not.toContain('raw-reset-token');
    expect(JSON.stringify(event)).not.toContain('raw-password');
    expect(JSON.stringify(event)).not.toContain('Reader@Example.test');
  });

  it('keeps audit metadata limited to safe scalar values', async () => {
    await recordAuthEvent({
      event: 'rate_limit',
      outcome: 'denied',
      metadata: {
        subject: 'email',
        limit: 5,
        allowed: false,
        nested: { rawToken: 'secret' },
        missing: undefined,
      },
    });

    await expect(AuthEventModel.findOne({ event: 'rate_limit' }).lean()).resolves.toMatchObject({
      metadata: { subject: 'email', limit: 5, allowed: false },
    });
  });
});

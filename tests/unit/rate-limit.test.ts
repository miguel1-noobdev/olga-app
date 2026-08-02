import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { RateLimitModel } from '@/lib/db/models/rate-limit';

describe('durable rolling-hour rate limits', () => {
  let mongoServer: MongoMemoryServer;
  beforeEach(async () => { mongoServer = await MongoMemoryServer.create(); await mongoose.connect(mongoServer.getUri()); });
  afterEach(async () => { await mongoose.disconnect(); await mongoServer.stop(); });

  it('allows five email attempts and rejects the sixth', async () => {
    const attempts: boolean[] = [];
    for (let i = 0; i < 6; i += 1) attempts.push(await consumeRateLimit({ subject: 'email', key: 'reader@example.test', limit: 5 }));
    expect(attempts.filter(Boolean)).toHaveLength(5);
    expect(attempts.at(-1)).toBe(false);
    expect(await RateLimitModel.findOne({ subject: 'email' })).toMatchObject({ hits: 6 });
  });

  it('allows twenty trusted IP attempts and rejects the twenty-first', async () => {
    const attempts: boolean[] = [];
    for (let i = 0; i < 21; i += 1) attempts.push(await consumeRateLimit({ subject: 'ip', key: '203.0.113.4', limit: 20 }));
    expect(attempts.filter(Boolean)).toHaveLength(20);
    expect(attempts.at(-1)).toBe(false);
  });

  it('starts a fresh window after expiry', async () => {
    const first = new Date('2026-08-01T12:00:00.000Z');
    await consumeRateLimit({ subject: 'email', key: 'reader@example.test', limit: 1, now: first });
    expect(await consumeRateLimit({ subject: 'email', key: 'reader@example.test', limit: 1, now: new Date('2026-08-01T13:01:00.000Z') })).toBe(true);
  });
});

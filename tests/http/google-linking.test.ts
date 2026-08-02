// @vitest-environment node

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityModel } from '@/lib/db/models/identity';
import { createUserRepository } from '@/lib/db/repository/user';

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const GOOGLE_CONFIG = {
  GOOGLE_OAUTH_ENABLED: 'true',
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
};

async function postLink(body: Record<string, unknown>): Promise<Response> {
  const { POST } = await import('@/app/api/auth/link-google/route');
  return POST(new Request('http://localhost/api/auth/link-google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('Google linking HTTP contract', () => {
  let mongoServer: MongoMemoryServer;
  let subscriberId: string;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    getServerSessionMock.mockResolvedValue(null);
    process.env.GOOGLE_OAUTH_ENABLED = GOOGLE_CONFIG.GOOGLE_OAUTH_ENABLED;
    process.env.GOOGLE_CLIENT_ID = GOOGLE_CONFIG.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = GOOGLE_CONFIG.GOOGLE_CLIENT_SECRET;

    const subscriber = await createUserRepository().create({
      email: 'subscriber@example.test',
      password: 'subscriber-password',
      role: 'suscriptora',
    });
    subscriberId = subscriber.id;
  });

  afterEach(async () => {
    delete process.env.GOOGLE_OAUTH_ENABLED;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    vi.clearAllMocks();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('denies linking when the explicit Google release flag is disabled', async () => {
    delete process.env.GOOGLE_OAUTH_ENABLED;
    getServerSessionMock.mockResolvedValue({ user: { id: subscriberId } });

    const response = await postLink({ action: 'start' });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'google_unavailable' });
  });

  it('creates only a Google identity for an authenticated verified subscriber', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });

    const start = await postLink({ action: 'start' });
    expect(start.status).toBe(201);
    const { proofUrl } = await start.json() as { proofUrl: string };
    const rawToken = new URL(proofUrl).searchParams.get('token');
    expect(rawToken).toBeTruthy();

    const response = await postLink({
      action: 'complete',
      token: rawToken!,
      providerAccountId: 'google-account-1',
      email: 'google-owner@example.test',
      emailVerified: true,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ linked: true });
    await expect(IdentityModel.findOne({
      accountId: subscriberId,
      provider: 'google',
      providerAccountId: 'google-account-1',
    })).resolves.toMatchObject({ email: 'google-owner@example.test' });
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(1);

    const replay = await postLink({
      action: 'complete',
      token: rawToken!,
      providerAccountId: 'google-account-1',
      email: 'google-owner@example.test',
      emailVerified: true,
    });
    expect(replay.status).toBe(400);
  });

  it('rejects a provider identity that is already linked to another account', async () => {
    const other = await createUserRepository().create({
      email: 'other@example.test',
      password: 'other-password',
    });
    await IdentityModel.create({
      accountId: other.id,
      provider: 'google',
      providerAccountId: 'google-account-1',
      email: 'google-owner@example.test',
    });
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });

    const start = await postLink({ action: 'start' });
    const { proofUrl } = await start.json() as { proofUrl: string };
    const rawToken = new URL(proofUrl).searchParams.get('token');
    expect(rawToken).toBeTruthy();

    const response = await postLink({
      action: 'complete',
      token: rawToken!,
      providerAccountId: 'google-account-1',
      email: 'google-owner@example.test',
      emailVerified: true,
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'google_link_denied' });
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);
  });

  it('creates a verified Google account as suscriptora and preserves a linked staff role', async () => {
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;
    const newUser = { email: 'new-google@example.test' } as { email: string; [key: string]: unknown };

    await expect(signIn({
      user: newUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'google-new' },
      profile: { email: newUser.email, email_verified: true },
    } as never)).resolves.toBe(true);

    const created = await createUserRepository().findByEmail(newUser.email);
    expect(created).toMatchObject({ role: 'suscriptora', accountStatus: 'active', emailVerified: true });
    await expect(IdentityModel.findOne({ providerAccountId: 'google-new' })).resolves.toMatchObject({
      accountId: created!.id,
    });

    const staff = await createUserRepository().create({
      email: 'staff-google@example.test',
      password: 'staff-password',
      role: 'productora',
    });
    await IdentityModel.create({
      accountId: staff.id,
      provider: 'google',
      providerAccountId: 'google-staff',
      email: staff.email,
    });
    const linkedUser = { email: staff.email } as { email: string; [key: string]: unknown };

    await expect(signIn({
      user: linkedUser,
      account: { provider: 'google', type: 'oauth', providerAccountId: 'google-staff' },
      profile: { email: staff.email, email_verified: true },
    } as never)).resolves.toBe(true);
    expect(linkedUser.role).toBe('productora');
  });

  it('denies OAuth sign-in when a verified Google email only matches a local account', async () => {
    await createUserRepository().create({
      email: 'local@example.test',
      password: 'local-password',
    });
    const { authOptions } = await import('@/lib/auth/options');
    const signIn = authOptions.callbacks!.signIn!;

    const result = await signIn({
      user: { email: 'local@example.test' },
      account: { provider: 'google', type: 'oauth', providerAccountId: 'google-account-2' },
      profile: { email: 'local@example.test', email_verified: true },
    } as never);

    expect(result).toBe(false);
    await expect(IdentityModel.findOne({
      provider: 'google',
      providerAccountId: 'google-account-2',
    })).resolves.toBeNull();
  });
});

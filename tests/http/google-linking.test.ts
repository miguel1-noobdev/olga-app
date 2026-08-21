// @vitest-environment node

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityModel } from '@/lib/db/models/identity';
import { GoogleLinkIntentModel } from '@/lib/db/models/google-link-intent';
import { UserModel } from '@/lib/db/models/user';
import { createUserRepository } from '@/lib/db/repository/user';

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

const { exchangeAndVerifyGoogleIdTokenMock } = vi.hoisted(() => ({
  exchangeAndVerifyGoogleIdTokenMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/google-oidc', () => ({
  exchangeAndVerifyGoogleIdToken: exchangeAndVerifyGoogleIdTokenMock,
}));

const GOOGLE_CONFIG = {
  GOOGLE_OAUTH_ENABLED: 'true',
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
};

async function postLink(body: Record<string, unknown> = {}): Promise<Response> {
  const { POST } = await import('@/app/api/auth/link-google/route');
  return POST(new Request('http://localhost/api/auth/link-google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

async function getLinkCallback(params: Record<string, string>): Promise<Response> {
  const { GET } = await import('@/app/api/auth/link-google/callback/route');
  const url = new URL('http://localhost/api/auth/link-google/callback');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return GET(new Request(url));
}

describe('Google linking HTTP contract', () => {
  let mongoServer: MongoMemoryReplSet;
  let subscriberId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      IdentityModel.deleteMany({}),
      GoogleLinkIntentModel.deleteMany({}),
    ]);
    getServerSessionMock.mockResolvedValue(null);
    exchangeAndVerifyGoogleIdTokenMock.mockReset();
    process.env.GOOGLE_OAUTH_ENABLED = GOOGLE_CONFIG.GOOGLE_OAUTH_ENABLED;
    process.env.GOOGLE_CLIENT_ID = GOOGLE_CONFIG.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = GOOGLE_CONFIG.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_LINK_INTENT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

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
    delete process.env.GOOGLE_LINK_INTENT_ENCRYPTION_KEY;
    vi.clearAllMocks();
  });

  afterAll(async () => {
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

  it('stores one server-held, expiry-bound OAuth intent and exposes only its authorization redirect', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });

    const start = await postLink({ action: 'start' });
    expect(start.status).toBe(201);
    const { authorizationUrl, expiresAt } = await start.json() as {
      authorizationUrl: string;
      expiresAt: string;
    };
    const authorization = new URL(authorizationUrl);
    const state = authorization.searchParams.get('state');
    const nonce = authorization.searchParams.get('nonce');
    const codeChallenge = authorization.searchParams.get('code_challenge');

    expect(authorization).toMatchObject({
      origin: 'https://accounts.google.com',
      pathname: '/o/oauth2/v2/auth',
    });
    expect(authorization.searchParams.get('client_id')).toBe(GOOGLE_CONFIG.GOOGLE_CLIENT_ID);
    expect(authorization.searchParams.get('response_type')).toBe('code');
    expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');
    expect(state).toBeTruthy();
    expect(nonce).toBeTruthy();
    expect(codeChallenge).toBeTruthy();

    const intent = await GoogleLinkIntentModel.findOne({ accountId: subscriberId })
      .select('+stateHash +encryptedCodeVerifier')
      .lean();
    expect(intent).toMatchObject({
      accountId: subscriberId,
      securityVersion: 0,
      nonce,
      codeChallenge,
      consumedAt: null,
    });
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(intent?.expiresAt.toISOString()).toBe(expiresAt);
    expect(intent?.stateHash).not.toBe(state);
    expect(intent?.encryptedCodeVerifier).not.toBe(state);
    expect(intent).not.toHaveProperty('state');
    expect(intent).not.toHaveProperty('codeVerifier');
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);

    const nextStart = await postLink({ action: 'start' });
    expect(nextStart.status).toBe(201);
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);
  });

  it('atomically replaces concurrent active intents without removing consumed history', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const initialStart = await postLink({ action: 'start' });
    const { authorizationUrl } = await initialStart.json() as { authorizationUrl: string };
    const initialState = new URL(authorizationUrl).searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'historic-google-subject',
      email: 'historic-owner@example.test',
    });

    await getLinkCallback({ code: 'historic-authorization-code', state: initialState });

    const starts = await Promise.all([
      postLink({ action: 'start' }),
      postLink({ action: 'start' }),
    ]);

    expect(starts.map((response) => response.status)).toEqual([201, 201]);
    await expect(GoogleLinkIntentModel.countDocuments({
      accountId: subscriberId,
      consumedAt: null,
    })).resolves.toBe(1);
    await expect(GoogleLinkIntentModel.countDocuments({
      accountId: subscriberId,
      consumedAt: { $ne: null },
      providerAccountId: 'historic-google-subject',
    })).resolves.toBe(1);
  });

  it('denies linking for an active but unverified subscriber through getCurrentUser', async () => {
    const unverified = await createUserRepository().create({
      email: 'unverified@example.test',
      password: 'unverified-password',
      emailVerified: false,
    });
    getServerSessionMock.mockResolvedValue({
      user: { id: unverified.id, role: 'suscriptora', securityVersion: 0 },
    });

    const response = await postLink({ action: 'start' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'google_link_denied' });
  });

  it('rejects a stale session version before persisting an OAuth intent', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 1 },
    });

    const response = await postLink({ action: 'start' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'google_link_denied' });
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);
  });

  it.each([
    ['a missing security version', undefined],
    ['a non-number security version', '0'],
  ])('rejects a session with %s before persisting an OAuth intent', async (_name, securityVersion) => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion },
    });

    const response = await postLink({ action: 'start' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'google_link_denied' });
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);
  });

  it('rejects client-supplied Google identity completion without creating an identity', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });

    const response = await postLink({
      action: 'complete',
      providerAccountId: 'google-account-1',
      email: 'google-owner@example.test',
      emailVerified: true,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'google_link_denied' });
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);
  });

  it('exchanges the authorization code server-side, binds verified claims to the matching intent, and never accepts a browser Google subject', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const authorization = new URL(authorizationUrl);
    const state = authorization.searchParams.get('state')!;
    const nonce = authorization.searchParams.get('nonce')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'verified-google-subject',
      email: 'verified-owner@example.test',
    });

    const response = await getLinkCallback({
      code: 'google-authorization-code',
      state,
      providerAccountId: 'browser-subject-must-be-ignored',
      email: 'browser-owner@example.test',
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://localhost/login?googleLink=verified');
    expect(exchangeAndVerifyGoogleIdTokenMock).toHaveBeenCalledWith(expect.objectContaining({
      code: 'google-authorization-code',
      nonce,
      clientId: GOOGLE_CONFIG.GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CONFIG.GOOGLE_CLIENT_SECRET,
      codeVerifier: expect.any(String),
    }));
    const intent = await GoogleLinkIntentModel.findOne({ accountId: subscriberId }).lean();
    expect(intent).toMatchObject({
      consumedAt: expect.any(Date),
      providerAccountId: 'verified-google-subject',
      email: 'verified-owner@example.test',
      verifiedAt: expect.any(Date),
    });
    await expect(IdentityModel.findOne({
      accountId: subscriberId,
      provider: 'google',
      providerAccountId: 'verified-google-subject',
    }).lean()).resolves.toMatchObject({ email: 'verified-owner@example.test' });
  });

  it('atomically consumes a verified intent and links only the server-verified Google identity', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const state = new URL(authorizationUrl).searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'verified-google-subject',
      email: 'verified-owner@example.test',
    });

    const response = await getLinkCallback({
      code: 'google-authorization-code',
      state,
      providerAccountId: 'browser-subject-must-be-ignored',
      email: 'browser-owner@example.test',
    });

    expect(response.headers.get('location')).toBe('http://localhost/login?googleLink=verified');
    await expect(IdentityModel.findOne({
      provider: 'google',
      providerAccountId: 'verified-google-subject',
    }).lean()).resolves.toMatchObject({
      accountId: subscriberId,
      email: 'verified-owner@example.test',
    });
    await expect(GoogleLinkIntentModel.findOne({ accountId: subscriberId }).lean()).resolves.toMatchObject({
      consumedAt: expect.any(Date),
      providerAccountId: 'verified-google-subject',
    });
    await expect(createUserRepository().findById(subscriberId)).resolves.toMatchObject({
      role: 'suscriptora',
      accountStatus: 'active',
      emailVerified: true,
      securityVersion: 0,
    });
  });

  it('denies a verified provider subject linked to another account without consuming the intent', async () => {
    const otherSubscriber = await createUserRepository().create({
      email: 'other-subscriber@example.test',
      password: 'other-subscriber-password',
    });
    await IdentityModel.create({
      accountId: otherSubscriber.id,
      provider: 'google',
      providerAccountId: 'foreign-google-subject',
      email: otherSubscriber.email,
    });
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const state = new URL(authorizationUrl).searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'foreign-google-subject',
      email: 'verified-owner@example.test',
    });

    const response = await getLinkCallback({ code: 'google-authorization-code', state });

    expect(response.headers.get('location')).toBe('http://localhost/login?error=GOOGLE_LINK_DENIED');
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);
    await expect(IdentityModel.findOne({ providerAccountId: 'foreign-google-subject' }).lean()).resolves.toMatchObject({
      accountId: otherSubscriber.id,
    });
  });

  it('accepts an already linked provider subject for the initiating subscriber without changing the account', async () => {
    await IdentityModel.create({
      accountId: subscriberId,
      provider: 'google',
      providerAccountId: 'existing-google-subject',
      email: 'previous-google-email@example.test',
    });
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const state = new URL(authorizationUrl).searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'existing-google-subject',
      email: 'verified-owner@example.test',
    });

    const response = await getLinkCallback({ code: 'google-authorization-code', state });

    expect(response.headers.get('location')).toBe('http://localhost/login?googleLink=verified');
    await expect(IdentityModel.countDocuments({
      accountId: subscriberId,
      provider: 'google',
      providerAccountId: 'existing-google-subject',
    })).resolves.toBe(1);
    await expect(createUserRepository().findById(subscriberId)).resolves.toMatchObject({
      role: 'suscriptora',
      securityVersion: 0,
    });
  });

  it('rejects completion when the initiating subscriber security version changes after intent issuance', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const state = new URL(authorizationUrl).searchParams.get('state')!;
    await createUserRepository().advanceSecurityVersion(subscriberId);

    const response = await getLinkCallback({ code: 'google-authorization-code', state });

    expect(response.headers.get('location')).toBe('http://localhost/login?error=GOOGLE_LINK_DENIED');
    expect(exchangeAndVerifyGoogleIdTokenMock).not.toHaveBeenCalled();
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);
  });

  it('allows only one concurrent callback to consume the intent and create an identity', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const state = new URL(authorizationUrl).searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockResolvedValue({
      providerAccountId: 'concurrent-google-subject',
      email: 'verified-owner@example.test',
    });

    const callbacks = await Promise.all([
      getLinkCallback({ code: 'google-authorization-code-1', state }),
      getLinkCallback({ code: 'google-authorization-code-2', state }),
    ]);

    expect(callbacks.map((response) => response.headers.get('location')).sort()).toEqual([
      'http://localhost/login?error=GOOGLE_LINK_DENIED',
      'http://localhost/login?googleLink=verified',
    ]);
    await expect(IdentityModel.countDocuments({
      provider: 'google',
      providerAccountId: 'concurrent-google-subject',
    })).resolves.toBe(1);
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: { $ne: null } })).resolves.toBe(1);
  });

  it('rejects state/session/verification failures without consuming the intent or mutating identities', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 0 },
    });
    const start = await postLink({ action: 'start' });
    const { authorizationUrl } = await start.json() as { authorizationUrl: string };
    const authorization = new URL(authorizationUrl);
    const state = authorization.searchParams.get('state')!;
    exchangeAndVerifyGoogleIdTokenMock.mockRejectedValue(new Error('ID token verification failed'));

    const invalidState = await getLinkCallback({ code: 'code', state: 'wrong-state' });
    expect(invalidState.status).toBe(303);
    expect(exchangeAndVerifyGoogleIdTokenMock).not.toHaveBeenCalled();

    const rejectedToken = await getLinkCallback({ code: 'code', state });
    expect(rejectedToken.status).toBe(303);
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);
    await expect(IdentityModel.countDocuments({ accountId: subscriberId })).resolves.toBe(0);

    getServerSessionMock.mockResolvedValue({
      user: { id: subscriberId, role: 'suscriptora', securityVersion: 1 },
    });
    const staleSession = await getLinkCallback({ code: 'code', state });
    expect(staleSession.status).toBe(303);
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);

    const foreignSubscriber = await createUserRepository().create({
      email: 'foreign-session@example.test',
      password: 'foreign-session-password',
    });
    exchangeAndVerifyGoogleIdTokenMock.mockClear();
    getServerSessionMock.mockResolvedValue({
      user: { id: foreignSubscriber.id, role: 'suscriptora', securityVersion: 0 },
    });
    const foreignSession = await getLinkCallback({ code: 'code', state });

    expect(foreignSession.status).toBe(303);
    expect(exchangeAndVerifyGoogleIdTokenMock).not.toHaveBeenCalled();
    await expect(GoogleLinkIntentModel.countDocuments({ accountId: subscriberId, consumedAt: null })).resolves.toBe(1);
  });

  it('creates a verified Google account as suscriptora and denies linked staff sign-in', async () => {
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

    for (const role of ['productora', 'admin'] as const) {
      const staff = await createUserRepository().create({
        email: `${role}-google@example.test`,
        password: 'staff-password',
        role,
      });
      await IdentityModel.create({
        accountId: staff.id,
        provider: 'google',
        providerAccountId: `google-${role}`,
        email: staff.email,
      });
      const linkedUser = { email: staff.email } as { email: string; [key: string]: unknown };

      await expect(signIn({
        user: linkedUser,
        account: { provider: 'google', type: 'oauth', providerAccountId: `google-${role}` },
        profile: { email: staff.email, email_verified: true },
      } as never)).resolves.toBe(false);
      expect(linkedUser).toEqual({ email: staff.email });
      await expect(IdentityModel.countDocuments({ accountId: staff.id })).resolves.toBe(1);
    }
  });

  it.each(['productora', 'admin'] as const)(
    'denies Google linking for %s without modifying its identity',
    async (role) => {
      const staff = await createUserRepository().create({
        email: `${role}-link@example.test`,
        password: 'staff-password',
        role,
      });
      await IdentityModel.create({
        accountId: staff.id,
        provider: 'google',
        providerAccountId: `google-link-${role}`,
        email: staff.email,
      });
      const identityBefore = await IdentityModel.findOne({ accountId: staff.id }).lean();
      getServerSessionMock.mockResolvedValue({
        user: { id: staff.id, role, securityVersion: staff.securityVersion },
      });

      const response = await postLink({ action: 'start' });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'google_link_denied' });
      await expect(IdentityModel.findOne({ accountId: staff.id }).lean()).resolves.toEqual(identityBefore);
    },
  );

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

    expect(result).toBe('/login?error=GOOGLE_CREDENTIALS_FALLBACK');
    await expect(IdentityModel.findOne({
      provider: 'google',
      providerAccountId: 'google-account-2',
    })).resolves.toBeNull();
  });
});

// @vitest-environment node

import { spawn, type ChildProcess } from 'node:child_process';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthTokenModel, hashAuthToken } from '@/lib/db/models/auth-token';
import { createUserRepository } from '@/lib/db/repository/user';

const PORT = 3416;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'role-test-password';
const RESET_PASSWORD = 'role-reset-password';
const RESET_TOKEN = 'role-reset-token';
const ACCOUNT_CHECK_SIGNATURE_HEADER = 'x-account-check-signature';
const USER_ID_HEADER = 'x-user-id';
const roles = ['suscriptora', 'productora', 'admin'] as const;
type Role = (typeof roles)[number];

vi.setConfig({ testTimeout: 120_000 });

type CookieJar = Map<string, string>;

let mongoServer: MongoMemoryServer;
let nextServer: ChildProcess;
let serverOutput = '';
let productoraId: string;

describe('HTTP role harness helpers', () => {
  it('requires successful readiness responses and reports protected-route diagnostics', () => {
    expect(isReadyStatus(200)).toBe(true);
    expect(isReadyStatus(503)).toBe(false);
    expect(describeProtectedResponse(new Response(null, {
      status: 503,
      headers: { location: '/login', server: 'next.js' },
    }))).toBe('status=503 Location=/login server=next.js');
    expect(() => expectProtectedStatus(new Response(null, {
      status: 503,
      headers: { location: '/login', server: 'next.js' },
    }), '/blog', 200)).toThrow('/blog status=503 Location=/login server=next.js');
  });
});

function isReadyStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function describeProtectedResponse(response: Response): string {
  return `status=${response.status} Location=${response.headers.get('location') ?? 'none'} server=${response.headers.get('server') ?? 'none'}`;
}

function cookieHeader(jar: CookieJar): string {
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

function storeCookies(response: Response, jar: CookieJar): void {
  const cookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    const [name, value] = cookie.split(';', 1)[0].split('=');
    if (name && value) jar.set(name, value);
  }
}

async function request(path: string, jar?: CookieJar, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (jar && jar.size > 0) headers.set('cookie', cookieHeader(jar));
  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers, redirect: 'manual' });
  if (jar) storeCookies(response, jar);
  return response;
}

async function signIn(email: string, password = PASSWORD): Promise<CookieJar> {
  const jar = new Map<string, string>();
  const csrfResponse = await request('/api/auth/csrf', jar);
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
  const response = await request('/api/auth/callback/credentials', jar, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE_URL}/`,
    }),
  });

  expect(response.status).toBe(302);
  expect(jar.get('next-auth.session-token')).toBeTruthy();
  return jar;
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (isReadyStatus(response.status)) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js HTTP server did not become ready\n${serverOutput}`);
}

async function waitForAccountAccess(userId: string): Promise<void> {
  const deadline = Date.now() + 120_000;
  let latestResponse = 'request failed before receiving an HTTP response';
  while (Date.now() < deadline) {
    try {
      const signature = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
        .update(userId)
        .digest('hex');
      const response = await fetch(`${BASE_URL}/api/auth/account-access`, {
        headers: {
          [ACCOUNT_CHECK_SIGNATURE_HEADER]: signature,
          [USER_ID_HEADER]: userId,
        },
      });
      latestResponse = describeProtectedResponse(response);
      if (isReadyStatus(response.status)) return;
    } catch {
      latestResponse = 'request failed before receiving an HTTP response';
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Signed account-access dependency did not become ready: ${latestResponse}\n${serverOutput}`);
}

function expectProtectedStatus(response: Response, path: string, expectedStatus: number): void {
  expect(response.status, `${path} ${describeProtectedResponse(response)}`).toBe(expectedStatus);
}

describe('real HTTP role access', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.NEXTAUTH_SECRET = 'http-role-test-secret';
    process.env.NEXTAUTH_URL = BASE_URL;
    process.env.INTERNAL_ACCOUNT_CHECK_ORIGIN = BASE_URL;

    await mongoose.connect(mongoServer.getUri());
    const repository = createUserRepository();
    for (const role of roles) {
      const user = await repository.create({ email: `${role}@example.com`, password: PASSWORD, role });
      if (role === 'productora') productoraId = user.id;
    }
    await AuthTokenModel.create({
      accountId: productoraId,
      purpose: 'password_reset',
      tokenHash: hashAuthToken(RESET_TOKEN),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      securityVersion: 0,
    });
    await mongoose.disconnect();

    nextServer = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(PORT)], {
      cwd: process.cwd(),
      env: { ...process.env, MONGODB_URI: mongoServer.getUri(), NODE_ENV: 'development' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    nextServer.stdout?.on('data', (chunk) => { serverOutput += chunk.toString(); });
    nextServer.stderr?.on('data', (chunk) => { serverOutput += chunk.toString(); });
    await waitForServer();
    await waitForAccountAccess(productoraId);
  }, 180_000);

  afterAll(async () => {
    nextServer?.kill('SIGTERM');
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it('allows anonymous public access and redirects anonymous protected requests', async () => {
    expect((await request('/login')).status).toBe(200);

    for (const path of ['/blog', '/jardin-digital', '/laboratorio', '/admin']) {
      const response = await request(path);
      expectProtectedStatus(response, path, 307);
      expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/login');
    }
  });

  it('allows suscriptora only into registered-user areas', async () => {
    const session = await signIn('suscriptora@example.com');
    for (const path of ['/blog', '/jardin-digital']) {
      expectProtectedStatus(await request(path, session), path, 200);
    }
    for (const path of ['/laboratorio', '/admin']) {
      const response = await request(path, session);
      expectProtectedStatus(response, path, 307);
      expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/');
    }
  });

  it('allows productora into the laboratory but denies admin', async () => {
    const session = await signIn('productora@example.com');
    for (const path of ['/blog', '/jardin-digital', '/laboratorio']) {
      expectProtectedStatus(await request(path, session), path, 200);
    }
    const response = await request('/admin', session);
    expectProtectedStatus(response, '/admin', 307);
    expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/');
  });

  it('allows admin into admin and laboratory areas', async () => {
    const session = await signIn('admin@example.com');
    for (const path of ['/blog', '/jardin-digital', '/laboratorio', '/admin']) {
      expectProtectedStatus(await request(path, session), path, 200);
    }
  });

  it('denies every non-admin role at the admin HTTP API boundary', async () => {
    expectProtectedStatus(await request('/api/admin/health'), '/api/admin/health', 401);
    for (const role of ['suscriptora', 'productora'] as const) {
      const response = await request('/api/admin/health', await signIn(`${role}@example.com`));
      expectProtectedStatus(response, `/api/admin/health (${role})`, 403);
    }
    expectProtectedStatus(
      await request('/api/admin/health', await signIn('admin@example.com')),
      '/api/admin/health (admin)',
      200,
    );
  });

  it('rejects a reset-token replay and invalidates the prior staff session', async () => {
    const oldSession = await signIn('productora@example.com');
    expectProtectedStatus(await request('/blog', oldSession), '/blog', 200);

    const reset = await request('/api/auth/reset-password', undefined, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: productoraId, token: RESET_TOKEN, password: RESET_PASSWORD }),
    });
    expect(reset.status).toBe(200);

    const replay = await request('/api/auth/reset-password', undefined, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: productoraId, token: RESET_TOKEN, password: RESET_PASSWORD }),
    });
    expect(replay.status).toBe(400);

    const staleBlog = await request('/blog', oldSession);
    expectProtectedStatus(staleBlog, '/blog', 307);
    expect(new URL(staleBlog.headers.get('location')!, BASE_URL).pathname).toBe('/');
    expectProtectedStatus(
      await request('/blog', await signIn('productora@example.com', RESET_PASSWORD)),
      '/blog',
      200,
    );
  });
});

// @vitest-environment node

import { spawn, type ChildProcess } from 'node:child_process';
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
const roles = ['suscriptora', 'productora', 'admin'] as const;
type Role = (typeof roles)[number];

vi.setConfig({ testTimeout: 120_000 });

type CookieJar = Map<string, string>;

let mongoServer: MongoMemoryServer;
let nextServer: ChildProcess;
let serverOutput = '';
let productoraId: string;

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
      if (response.status !== 404) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js HTTP server did not become ready\n${serverOutput}`);
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
  }, 360_000);

  afterAll(async () => {
    nextServer?.kill('SIGTERM');
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it('allows anonymous public access and redirects anonymous protected requests', async () => {
    expect((await request('/login')).status).toBe(200);

    for (const path of ['/blog', '/jardin-digital', '/laboratorio', '/admin']) {
      const response = await request(path);
      expect(response.status, path).toBe(307);
      expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/login');
    }
  });

  it('allows suscriptora only into registered-user areas', async () => {
    const session = await signIn('suscriptora@example.com');
    for (const path of ['/blog', '/jardin-digital']) {
      expect((await request(path, session)).status, path).toBe(200);
    }
    for (const path of ['/laboratorio', '/admin']) {
      const response = await request(path, session);
      expect(response.status, path).toBe(307);
      expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/');
    }
  });

  it('allows productora into the laboratory but denies admin', async () => {
    const session = await signIn('productora@example.com');
    for (const path of ['/blog', '/jardin-digital', '/laboratorio']) {
      expect((await request(path, session)).status, path).toBe(200);
    }
    const response = await request('/admin', session);
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location')!, BASE_URL).pathname).toBe('/');
  });

  it('allows admin into admin and laboratory areas', async () => {
    const session = await signIn('admin@example.com');
    for (const path of ['/blog', '/jardin-digital', '/laboratorio', '/admin']) {
      expect((await request(path, session)).status, path).toBe(200);
    }
  });

  it('denies every non-admin role at the admin HTTP API boundary', async () => {
    expect((await request('/api/admin/health')).status).toBe(401);
    for (const role of ['suscriptora', 'productora'] as const) {
      const response = await request('/api/admin/health', await signIn(`${role}@example.com`));
      expect(response.status, role).toBe(403);
    }
    expect((await request('/api/admin/health', await signIn('admin@example.com'))).status).toBe(200);
  });

  it('rejects a reset-token replay and invalidates the prior staff session', async () => {
    const oldSession = await signIn('productora@example.com');
    expect((await request('/blog', oldSession)).status).toBe(200);

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
    expect(staleBlog.status).toBe(307);
    expect(new URL(staleBlog.headers.get('location')!, BASE_URL).pathname).toBe('/');
    expect((await request('/blog', await signIn('productora@example.com', RESET_PASSWORD))).status).toBe(200);
  });
});

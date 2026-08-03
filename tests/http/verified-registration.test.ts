import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AuthTokenModel } from '@/lib/db/models/auth-token';
import { createUserRepository } from '@/lib/db/repository/user';
import { authorizeWithRepository } from '@/lib/auth/authorize-credentials';
import { POST as register } from '@/app/api/auth/register/route';
import { GET as getVerify, POST as verify } from '@/app/api/auth/verify/route';
import { POST as resend } from '@/app/api/auth/resend/route';

const { connectToDatabaseMock, sendMock, createEmailSenderMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(), sendMock: vi.fn(), createEmailSenderMock: vi.fn(),
}));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/email/sender', () => ({ createEmailSender: createEmailSenderMock }));

const headers = { 'Content-Type': 'application/json', 'x-trusted-proxy': 'local-nginx', 'x-forwarded-for': '203.0.113.4' };
function post(path: string, body: unknown): Promise<Response> {
  const handler = path === 'register' ? register : path === 'verify' ? verify : resend;
  return handler(new Request(`http://localhost/api/auth/${path}`, { method: 'POST', headers, body: JSON.stringify(body) }));
}

describe('verified registration HTTP flow', () => {
  let mongoServer: MongoMemoryServer;
  let urls: string[];

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    vi.stubEnv('NEXTAUTH_URL', 'https://botanicaob.example.test');
    connectToDatabaseMock.mockResolvedValue(undefined);
    urls = [];
    sendMock.mockImplementation(async ({ tokenUrl }: { tokenUrl: string }) => urls.push(tokenUrl));
    createEmailSenderMock.mockReturnValue({ send: sendMock });
  });
  afterEach(async () => { vi.unstubAllEnvs(); vi.clearAllMocks(); await mongoose.disconnect(); await mongoServer.stop(); });

  it('creates a pending subscriber and denies credentials before verification', async () => {
    const response = await post('register', { email: ' Reader@Example.test ', password: 'secret123' });
    const user = await createUserRepository().findByEmail('reader@example.test');
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ message: 'If the address can be registered, a verification email will be sent.' });
    expect(user).toMatchObject({ role: 'suscriptora', accountStatus: 'pending_email', emailVerified: false });
    expect(await authorizeWithRepository(createUserRepository(), { email: user!.email, password: 'secret123' })).toBeNull();
  });

  it('uses the configured application origin rather than the request host for verification links', async () => {
    const response = await register(new Request('https://attacker.example/api/auth/register', {
      method: 'POST', headers, body: JSON.stringify({ email: 'reader@example.test', password: 'secret123' }),
    }));

    expect(response.status).toBe(202);
    expect(new URL(urls[0])).toMatchObject({ origin: 'https://botanicaob.example.test', pathname: '/api/auth/verify' });
  });

  it('activates once, rejects replay, and supports the emailed GET link', async () => {
    await post('register', { email: 'reader@example.test', password: 'secret123' });
    const url = new URL(urls[0]);
    const body = { accountId: url.searchParams.get('accountId'), token: url.searchParams.get('token') };
    expect((await post('verify', body)).status).toBe(200);
    expect((await createUserRepository().findByEmail('reader@example.test'))?.accountStatus).toBe('active');
    expect(await (await post('verify', body)).json()).toEqual({ message: 'Verification could not be completed.' });
    const getResponse = await getVerify(new Request(urls[0]));
    expect(getResponse.status).toBe(303);
    expect(new URL(getResponse.headers.get('location')!).searchParams.get('verified')).toBe('false');
  });

  it('rotates resend tokens and hides unknown addresses', async () => {
    await post('register', { email: 'reader@example.test', password: 'secret123' });
    await AuthTokenModel.collection.updateMany({}, { $set: { createdAt: new Date('2026-07-01') } });
    const known = await post('resend', { email: 'reader@example.test' });
    const unknown = await post('resend', { email: 'unknown@example.test' });
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(known.status);
    expect(await unknown.json()).toEqual(await known.json());
    expect(urls).toHaveLength(2);
    expect(new URL(urls[0]).searchParams.get('token')).not.toBe(new URL(urls[1]).searchParams.get('token'));
  });

  it('keeps delivery failures generic, removes only the new pending account, and permits retry', async () => {
    const verifiedUser = await createUserRepository().create({ email: 'verified@example.test', password: 'secret123' });
    sendMock.mockRejectedValueOnce(new Error('smtp provider details must not leak'));
    const response = await post('register', { email: 'reader@example.test', password: 'secret123' });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: 'Registration could not be completed.' });
    expect(await createUserRepository().findByEmail('reader@example.test')).toBeNull();
    expect(await AuthTokenModel.countDocuments({ purpose: 'email_verification' })).toBe(0);
    expect(await createUserRepository().findById(verifiedUser.id)).toMatchObject({ accountStatus: 'active', emailVerified: true });
    expect((await post('register', { email: 'reader@example.test', password: 'secret123' })).status).toBe(202);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const { connectToDatabaseMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

async function callRegisterRoute(body: unknown): Promise<Response> {
  const { POST } = await import('@/app/api/auth/register/route');
  return POST(
    new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

describe('/api/auth/register POST', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    connectToDatabaseMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates a user and returns 201 with userId', async () => {
    const res = await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.message).toBe('User created successfully');
    expect(json.userId).toBeDefined();
  });

  it('stores a bcrypt hashed password, not plaintext', async () => {
    await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    const { createUserRepository } = await import('@/lib/db/repository/user');
    const repo = createUserRepository();
    const user = await repo.findByEmail('olga@botanicaob.com');

    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe('secret123');
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('assigns admin role to the first registered user', async () => {
    const res = await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    const json = await res.json();
    const { createUserRepository } = await import('@/lib/db/repository/user');
    const repo = createUserRepository();
    const user = await repo.findById(json.userId);

    expect(user?.role).toBe('admin');
  });

  it('assigns suscriptora role to subsequent users', async () => {
    await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    const res = await callRegisterRoute({
      email: 'miguel@botanicaob.com',
      password: 'secret456',
    });

    const json = await res.json();
    const { createUserRepository } = await import('@/lib/db/repository/user');
    const repo = createUserRepository();
    const user = await repo.findById(json.userId);

    expect(user?.role).toBe('suscriptora');
  });

  it('returns 409 when the email already exists', async () => {
    await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    const res = await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'other-password',
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists|ya existe/i);
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await callRegisterRoute({ email: 'olga@botanicaob.com' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required|obligatorio/i);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await callRegisterRoute({
      email: 'not-an-email',
      password: 'secret123',
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid email|email/i);
  });

  it('returns 400 for a password shorter than 8 characters', async () => {
    const res = await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Password must be at least|contraseña/i);
  });

  it('returns 500 for an unexpected repository error', async () => {
    const { createUserRepository } = await import('@/lib/db/repository/user');
    vi.spyOn(await import('@/lib/db/repository/user'), 'createUserRepository')
      .mockImplementation(() => ({
        ...createUserRepository(),
        create: async () => {
          throw new Error('Unexpected database failure');
        },
      }));

    const res = await callRegisterRoute({
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Registration failed');
  });
});

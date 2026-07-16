import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';
import { authorizeWithRepository } from '@/lib/auth/authorize-credentials';

describe('authorizeWithRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createUserRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = createUserRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('returns user object for valid credentials', async () => {
    const created = await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });

    const user = await authorizeWithRepository(repo, {
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    expect(user).toMatchObject({
      id: created.id,
      email: 'olga@botanicaob.com',
      role: 'suscriptora',
    });
  });

  it('returns null when the user does not exist', async () => {
    const user = await authorizeWithRepository(repo, {
      email: 'nobody@botanicaob.com',
      password: 'secret123',
    });
    expect(user).toBeNull();
  });

  it('returns null when the password is wrong', async () => {
    await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });

    const user = await authorizeWithRepository(repo, {
      email: 'olga@botanicaob.com',
      password: 'wrong-password',
    });

    expect(user).toBeNull();
  });

  it('returns null when email is missing', async () => {
    const user = await authorizeWithRepository(repo, { email: '', password: 'secret123' });
    expect(user).toBeNull();
  });

  it('returns null when password is missing', async () => {
    const user = await authorizeWithRepository(repo, {
      email: 'olga@botanicaob.com',
      password: '',
    });
    expect(user).toBeNull();
  });

  it('authorizes a productora user and returns the productora role', async () => {
    const created = await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
    await repo.updateRole(created.id, 'productora');

    const user = await authorizeWithRepository(repo, {
      email: 'olga@botanicaob.com',
      password: 'secret123',
    });

    expect(user).toMatchObject({
      id: created.id,
      email: 'olga@botanicaob.com',
      role: 'productora',
    });
  });

  it('rejects a suspended account even when its password is valid', async () => {
    const created = await repo.create({ email: 'suspended@botanicaob.com', password: 'secret123' });
    await repo.updateAccountStatus(created.id, 'suspended');

    const user = await authorizeWithRepository(repo, {
      email: 'suspended@botanicaob.com',
      password: 'secret123',
    });

    expect(user).toBeNull();
  });
});

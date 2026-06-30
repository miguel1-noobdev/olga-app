import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createUserRepository } from '@/lib/db/repository/user';

describe('UserRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createUserRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repo = createUserRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      const user = await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      expect(user.id).toBeDefined();
      expect(user.email).toBe('olga@botanicaob.com');
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('secret123');
      expect(user.createdAt).toBeDefined();
    });

    it('assigns admin role to the first user', async () => {
      const user = await repo.create({ email: 'first@botanicaob.com', password: 'secret123' });
      expect(user.role).toBe('admin');
    });

    it('assigns suscriptora role to subsequent users', async () => {
      await repo.create({ email: 'first@botanicaob.com', password: 'secret123' });
      const second = await repo.create({ email: 'second@botanicaob.com', password: 'secret456' });
      expect(second.role).toBe('suscriptora');
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      const user = await repo.create({ email: '  Olga@BotanicaOB.COM  ', password: 'secret123' });
      expect(user.email).toBe('olga@botanicaob.com');
    });

    it('rejects duplicate email (case-insensitive)', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      await expect(
        repo.create({ email: 'OLGA@botanicaob.com', password: 'other456' })
      ).rejects.toThrow(/already exists|ya existe/i);
    });

    it('rejects password shorter than 8 characters', async () => {
      await expect(
        repo.create({ email: 'olga@botanicaob.com', password: 'short' })
      ).rejects.toThrow(/password|contraseña/i);
    });

    it('rejects invalid email format', async () => {
      await expect(
        repo.create({ email: 'not-an-email', password: 'secret123' })
      ).rejects.toThrow(/email/i);
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      const found = await repo.findByEmail('olga@botanicaob.com');
      expect(found).not.toBeNull();
      expect(found?.email).toBe('olga@botanicaob.com');
    });

    it('is case-insensitive', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      const found = await repo.findByEmail('OLGA@botanicaob.com');
      expect(found).not.toBeNull();
    });

    it('returns null when not found', async () => {
      const found = await repo.findByEmail('nobody@botanicaob.com');
      expect(found).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      const user = await repo.findByEmail('olga@botanicaob.com');
      expect(await repo.verifyPassword(user!, 'secret123')).toBe(true);
    });

    it('returns false for wrong password', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      const user = await repo.findByEmail('olga@botanicaob.com');
      expect(await repo.verifyPassword(user!, 'wrong-password')).toBe(false);
    });
  });

  describe('count', () => {
    it('returns 0 when no users', async () => {
      expect(await repo.count()).toBe(0);
    });

    it('returns the number of users', async () => {
      await repo.create({ email: 'one@botanicaob.com', password: 'secret123' });
      await repo.create({ email: 'two@botanicaob.com', password: 'secret456' });
      expect(await repo.count()).toBe(2);
    });
  });

  describe('updateRole', () => {
    it('changes a user role (admin only operation)', async () => {
      await repo.create({ email: 'olga@botanicaob.com', password: 'secret123' });
      const olga = await repo.findByEmail('olga@botanicaob.com');
      await repo.updateRole(olga!.id, 'productora');
      const updated = await repo.findByEmail('olga@botanicaob.com');
      expect(updated?.role).toBe('productora');
    });
  });
});
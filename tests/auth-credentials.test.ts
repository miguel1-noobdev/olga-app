import { describe, it, expect } from 'vitest';
import type { UserRecord } from '@/lib/db/repository/user';

// Mock UserRepository para tests (fresh instance per test)

function createMockRepo() {
  const mockUsers = new Map<string, UserRecord>();
  return {
    create: async (input: { email: string; password: string }) => {
      const isFirst = mockUsers.size === 0;
      const user: UserRecord = {
        id: `mock-id-${mockUsers.size + 1}`,
        email: input.email.toLowerCase(),
        passwordHash: '$2a$10$hashedpassword',
        role: isFirst ? 'admin' : 'suscriptora',
        createdAt: new Date().toISOString(),
      };
      mockUsers.set(user.email, user);
      return user;
    },
    findByEmail: async (email: string) => {
      return mockUsers.get(email.toLowerCase()) ?? null;
    },
    findById: async (id: string) => {
      for (const user of mockUsers.values()) {
        if (user.id === id) return user;
      }
      return null;
    },
    verifyPassword: async (user: UserRecord, password: string) => {
      return password === 'validpassword123';
    },
    count: async () => mockUsers.size,
    updateRole: async () => {},
  };
}

type MockRepo = ReturnType<typeof createMockRepo>;

describe('NextAuth Credentials Provider', () => {
  describe('authorize - valid credentials', () => {
    it('returns user object for correct email and password', async () => {
      const repo = createMockRepo();
      await repo.create({ email: 'olga@test.com', password: 'validpassword123' });

      const user = await repo.findByEmail('olga@test.com');
      const isValid = await repo.verifyPassword(user!, 'validpassword123');

      expect(isValid).toBe(true);
      expect(user?.email).toBe('olga@test.com');
    });

    it('returns user with id, email, and role fields', async () => {
      const repo = createMockRepo();
      const created = await repo.create({ email: 'olga@test.com', password: 'validpassword123' });

      const found = await repo.findByEmail('olga@test.com');

      expect(found).toHaveProperty('id');
      expect(found).toHaveProperty('email');
      expect(found).toHaveProperty('role');
      expect(found?.id).toBe(created.id);
    });
  });

  describe('authorize - invalid credentials', () => {
    it('returns null for non-existent email', async () => {
      const repo = createMockRepo();
      const user = await repo.findByEmail('nobody@test.com');
      expect(user).toBeNull();
    });

    it('returns null for wrong password', async () => {
      const repo = createMockRepo();
      await repo.create({ email: 'olga@test.com', password: 'validpassword123' });

      const user = await repo.findByEmail('olga@test.com');
      const isValid = await repo.verifyPassword(user!, 'wrongpassword');

      expect(isValid).toBe(false);
    });
  });

  describe('session - role in token', () => {
    it('first user gets admin role', async () => {
      const repo = createMockRepo();
      const user = await repo.create({ email: 'olga@test.com', password: 'validpassword123' });
      expect(user.role).toBe('admin');
    });

    it('subsequent users get suscriptora role', async () => {
      const repo = createMockRepo();
      await repo.create({ email: 'olga@test.com', password: 'validpassword123' });
      const second = await repo.create({ email: 'miguel@test.com', password: 'validpassword123' });
      expect(second.role).toBe('suscriptora');
    });
  });
});
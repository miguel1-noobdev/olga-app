import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, connectMock, findByIdMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  connectMock: vi.fn(),
  findByIdMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(() => ({ findById: findByIdMock })),
}));

import { getCurrentUser } from '@/lib/auth/current-user';

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the persisted role instead of a stale session role', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'admin' } });
    findByIdMock.mockResolvedValue({
      id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active',
    });

    await expect(getCurrentUser()).resolves.toMatchObject({
      id: 'user-1', role: 'suscriptora', accountStatus: 'active',
    });
    expect(findByIdMock).toHaveBeenCalledWith('user-1');
  });

  it('denies a suspended account with a previously valid session', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'admin' } });
    findByIdMock.mockResolvedValue({
      id: 'user-1', email: 'reader@example.com', role: 'admin', accountStatus: 'suspended',
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});

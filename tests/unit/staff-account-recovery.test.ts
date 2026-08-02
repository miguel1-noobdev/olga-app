import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteManyMock, createEventMock } = vi.hoisted(() => ({
  deleteManyMock: vi.fn(),
  createEventMock: vi.fn(),
}));

vi.mock('@/lib/db/models/auth-token', () => ({ AuthTokenModel: { deleteMany: deleteManyMock } }));
vi.mock('@/lib/db/models/auth-event', () => ({ AuthEventModel: { create: createEventMock } }));

import { recoverStaffAccount } from '@/lib/auth/recovery';

describe('staff account recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteManyMock.mockResolvedValue({ acknowledged: true });
    createEventMock.mockResolvedValue({});
  });

  it('preserves an admin role and lifecycle status while revoking sessions', async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash: 'old-hash',
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
        securityVersion: 7,
        createdAt: '2026-08-02T00:00:00.000Z',
      }),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      advanceSecurityVersion: vi.fn().mockResolvedValue(undefined),
    };

    await expect(recoverStaffAccount(repo as never, 'admin-1', 'new-password-123')).resolves.toEqual({
      id: 'admin-1',
      role: 'admin',
      accountStatus: 'active',
      securityVersion: 8,
    });
    expect(repo.updatePassword).toHaveBeenCalledWith('admin-1', 'new-password-123');
    expect(repo.advanceSecurityVersion).toHaveBeenCalledWith('admin-1');
    expect(deleteManyMock).toHaveBeenCalledWith({ accountId: 'admin-1' });
    expect(createEventMock).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'admin-1',
      event: 'staff_account_recovery',
      outcome: 'success',
      metadata: { role: 'admin' },
    }));
  });

  it('rejects a subscriber without mutating role, password, or sessions', async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({
        id: 'reader-1',
        email: 'reader@example.com',
        passwordHash: 'old-hash',
        role: 'suscriptora',
        accountStatus: 'active',
        emailVerified: true,
        securityVersion: 0,
        createdAt: '2026-08-02T00:00:00.000Z',
      }),
      updatePassword: vi.fn(),
      advanceSecurityVersion: vi.fn(),
    };

    await expect(recoverStaffAccount(repo as never, 'reader-1', 'new-password-123'))
      .rejects.toThrow('Staff account not found.');
    expect(repo.updatePassword).not.toHaveBeenCalled();
    expect(repo.advanceSecurityVersion).not.toHaveBeenCalled();
    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});

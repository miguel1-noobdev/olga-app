import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getCurrentUserMock, connectMock, repositoryMock, recordMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  connectMock: vi.fn(),
  repositoryMock: {
    findAll: vi.fn(),
    updateRole: vi.fn(),
    updateAccountStatus: vi.fn(),
  },
  recordMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(() => repositoryMock),
}));
vi.mock('@/lib/admin/users/activity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin/users/activity')>()),
  createAdministrativeAuditRepository: vi.fn(() => ({ record: recordMock })),
}));

import { GET, PATCH } from '@/app/api/admin/usuarios/route';

describe('/api/admin/usuarios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('denies anonymous access and returns only approved directory fields to Admin', async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(403);

    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);
    getCurrentUserMock.mockResolvedValueOnce({ id: 'admin-1', role: 'admin' });

    const response = await GET();
    expect(await response.json()).toEqual({
      users: [{ id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active', createdAt: '2026-07-16T00:00:00.000Z' }],
    });
  });

  it('applies only a confirmed approved mutation and records its redacted audit event', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    const cancelled = await PATCH(new Request('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: false }),
    }));
    expect(cancelled.status).toBe(400);
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();

    const invalidRole = await PATCH(new Request('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'owner', confirmed: true }),
    }));
    expect(invalidRole.status).toBe(400);
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();

    const confirmed = await PATCH(new Request('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', accountStatus: 'suspended', confirmed: true }),
    }));
    expect(confirmed.status).toBe(200);
    expect(repositoryMock.updateAccountStatus).toHaveBeenCalledWith('user-1', 'suspended');
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'account_status_changed', subjectUserId: 'user-1', actorUserId: 'admin-1',
    }));
  });

  it('rejects an Admin attempt to suspend or demote their own account', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });

    const suspended = await PATCH(new Request('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', accountStatus: 'suspended', confirmed: true }),
    }));
    const demoted = await PATCH(new Request('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', role: 'suscriptora', confirmed: true }),
    }));

    expect(suspended.status).toBe(400);
    expect(demoted.status).toBe(400);
    expect(repositoryMock.updateAccountStatus).not.toHaveBeenCalled();
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getServerSessionMock,
  getCurrentUserMock,
  connectMock,
  repositoryMock,
  recordMock,
  withMongoLeaseLockMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  connectMock: vi.fn(),
  repositoryMock: {
    findAll: vi.fn(),
    findById: vi.fn(),
    updateRole: vi.fn(),
    updateAccountStatus: vi.fn(),
  },
  recordMock: vi.fn(),
  withMongoLeaseLockMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(() => repositoryMock),
}));
vi.mock('@/lib/db/mongo-lease-lock', () => ({
  withMongoLeaseLock: withMongoLeaseLockMock,
  MongoLeaseLockUnavailableError: class MongoLeaseLockUnavailableError extends Error {},
}));
vi.mock('@/lib/admin/users/activity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin/users/activity')>()),
  createAdministrativeAuditRepository: vi.fn(() => ({ record: recordMock })),
}));

import { GET, PATCH } from '@/app/api/admin/usuarios/route';
import { MongoLeaseLockUnavailableError } from '@/lib/db/mongo-lease-lock';

function requestWithOrigin(url: string, init: RequestInit, origin = 'http://localhost'): Request {
  const request = new Request(url, init);
  const headers = new Headers(init.headers);
  headers.set('Origin', origin);
  Object.defineProperty(request, 'headers', { value: headers });
  return request;
}

describe('/api/admin/usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost');
    repositoryMock.findAll.mockResolvedValue([]);
    withMongoLeaseLockMock.mockImplementation(async (work: (guard: { assertOwnership: () => Promise<void> }) => Promise<unknown>) => (
      work({ assertOwnership: vi.fn() })
    ));
  });

  afterEach(() => vi.unstubAllEnvs());

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
    repositoryMock.findById.mockResolvedValue({
      id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    const cancelled = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: false }),
      headers: { Origin: 'http://localhost' },
    }));
    expect(cancelled.status).toBe(400);
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();

    const invalidRole = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'owner', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));
    expect(invalidRole.status).toBe(400);
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();

    const confirmed = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', accountStatus: 'suspended', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));
    expect(confirmed.status).toBe(200);
    expect(repositoryMock.updateAccountStatus).toHaveBeenCalledWith('user-1', 'suspended');
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'account_status_changed', subjectUserId: 'user-1', actorUserId: 'admin-1',
    }));
  });

  it('rejects an Admin attempt to suspend or demote their own account', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    repositoryMock.findById.mockResolvedValue({
      id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);

    const suspended = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', accountStatus: 'suspended', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));
    const demoted = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', role: 'suscriptora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    expect(suspended.status).toBe(400);
    expect(demoted.status).toBe(400);
    expect(repositoryMock.updateAccountStatus).not.toHaveBeenCalled();
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();
  });

  it('rejects a mutation that would remove the last active admin', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-2', role: 'admin' });
    repositoryMock.findById.mockResolvedValue({
      id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);

    const demoted = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', role: 'productora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));
    const suspended = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', accountStatus: 'suspended', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    expect(demoted.status).toBe(400);
    expect(suspended.status).toBe(400);
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();
    expect(repositoryMock.updateAccountStatus).not.toHaveBeenCalled();
  });

  it('allows demoting one admin when another active admin remains', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-2', role: 'admin' });
    repositoryMock.findById.mockResolvedValue({
      id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'admin-1', email: 'admin-1@example.com', role: 'admin', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
      {
        id: 'admin-2', email: 'admin-2@example.com', role: 'admin', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);

    const demoted = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'admin-1', role: 'productora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    expect(demoted.status).toBe(200);
    expect(repositoryMock.updateRole).toHaveBeenCalledWith('admin-1', 'productora');
  });

  it('rolls back a role change when audit recording fails', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);
    repositoryMock.findById.mockResolvedValue({
      id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    recordMock.mockRejectedValue(new Error('Audit write failed'));

    const response = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(repositoryMock.updateRole).toHaveBeenCalledWith('user-1', 'productora');
    expect(repositoryMock.updateRole).toHaveBeenCalledWith('user-1', 'suscriptora');
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'role_changed', subjectUserId: 'user-1', actorUserId: 'admin-1',
    }));
    expect(body.error).toContain('Cambio revertido');
    expect(body.error).toContain('suscriptora');
    expect(body.error).not.toContain('Audit write failed');
  });

  it('rolls back an account status change when audit recording fails', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);
    repositoryMock.findById.mockResolvedValue({
      id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    recordMock.mockRejectedValue(new Error('Audit write failed'));

    const response = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', accountStatus: 'suspended', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(repositoryMock.updateAccountStatus).toHaveBeenCalledWith('user-1', 'suspended');
    expect(repositoryMock.updateAccountStatus).toHaveBeenCalledWith('user-1', 'active');
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'account_status_changed', subjectUserId: 'user-1', actorUserId: 'admin-1',
    }));
    expect(body.error).toContain('Cambio revertido');
    expect(body.error).toContain('active');
    expect(body.error).not.toContain('Audit write failed');
  });

  it('reports both audit and rollback failures for a role change without reverting', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);
    repositoryMock.findById.mockResolvedValue({
      id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    recordMock.mockRejectedValue(new Error('Audit write failed'));
    repositoryMock.updateRole
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Rollback role failed'));

    const response = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toContain('Cambio aplicado pero auditoría falló');
    expect(body.error).toContain('Estado actual: productora');
    expect(body.error).toContain('Error de auditoría');
    expect(body.error).toContain('Error de rollback');
    expect(body.error).not.toContain('Audit write failed');
    expect(body.error).not.toContain('Rollback role failed');
    expect(repositoryMock.updateRole).toHaveBeenCalledTimes(2);
    expect(repositoryMock.updateRole).toHaveBeenNthCalledWith(1, 'user-1', 'productora');
    expect(repositoryMock.updateRole).toHaveBeenNthCalledWith(2, 'user-1', 'suscriptora');
  });

  it('reports both audit and rollback failures for an account status change without reverting', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    repositoryMock.findAll.mockResolvedValue([
      {
        id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
        createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
      },
    ]);
    repositoryMock.findById.mockResolvedValue({
      id: 'user-1', email: 'user-1@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    });
    recordMock.mockRejectedValue(new Error('Audit write failed'));
    repositoryMock.updateAccountStatus
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Rollback status failed'));

    const response = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', accountStatus: 'suspended', confirmed: true }),
    }));

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toContain('Cambio aplicado pero auditoría falló');
    expect(body.error).toContain('Estado actual: suspended');
    expect(body.error).toContain('Error de auditoría');
    expect(body.error).toContain('Error de rollback');
    expect(body.error).not.toContain('Audit write failed');
    expect(body.error).not.toContain('Rollback status failed');
    expect(repositoryMock.updateAccountStatus).toHaveBeenCalledTimes(2);
    expect(repositoryMock.updateAccountStatus).toHaveBeenNthCalledWith(1, 'user-1', 'suspended');
    expect(repositoryMock.updateAccountStatus).toHaveBeenNthCalledWith(2, 'user-1', 'active');
  });

  it('returns a safe temporary-unavailable response when the mutation lock cannot be acquired', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    withMongoLeaseLockMock.mockRejectedValueOnce(new MongoLeaseLockUnavailableError());

    const response = await PATCH(requestWithOrigin('http://test/api/admin/usuarios', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: true }),
      headers: { Origin: 'http://localhost' },
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Administrative mutation temporarily unavailable' });
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin mutation before authentication or database work', async () => {
    const response = await PATCH(requestWithOrigin('http://localhost/api/admin/usuarios', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', role: 'productora', confirmed: true }),
    }, 'https://attacker.example'));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Invalid request origin' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
    expect(repositoryMock.updateRole).not.toHaveBeenCalled();
  });
});

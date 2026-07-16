import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { findAllMock, listSummariesMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
  listSummariesMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/user', () => ({
  createUserRepository: vi.fn(() => ({ findAll: findAllMock })),
}));
vi.mock('@/lib/admin/users/activity', () => ({
  createAdministrativeAuditRepository: vi.fn(() => ({ listSummaries: listSummariesMock })),
}));
vi.mock('@/components/admin/user-management', () => ({
  default: ({ users }: { users: Array<{ email: string; role: string; accountStatus: string }> }) => (
    <div>{users.map((user) => <span key={user.email}>{`${user.email} ${user.role} ${user.accountStatus}`}</span>)}</div>
  ),
}));

import AdminUsersPage from '@/app/admin/usuarios/page';

describe('/admin/usuarios page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the protected approved-field user directory without audit internals', async () => {
    findAllMock.mockResolvedValue([{
      id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active',
      createdAt: '2026-07-16T00:00:00.000Z', passwordHash: 'secret',
    }]);
    listSummariesMock.mockResolvedValue([{ type: 'role_changed', occurredAt: '2026-07-16T00:00:00.000Z' }]);

    render(await AdminUsersPage());

    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByText('reader@example.com suscriptora active')).toBeInTheDocument();
    expect(screen.getByText('Actividad administrativa')).toBeInTheDocument();
    expect(screen.getByText('Cambio de rol')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});

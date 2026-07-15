import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import AdminLayout from '@/app/admin/layout';

describe('/admin layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(AdminLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /login'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('redirects authenticated non-admin users to /', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'reader@test.com', role: 'suscriptora' },
    });

    await expect(AdminLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('redirects productora users to /', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    await expect(AdminLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('renders children for admin role', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    });

    const jsx = await AdminLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

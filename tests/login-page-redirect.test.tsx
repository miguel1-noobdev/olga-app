import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/components/auth/login-form', () => ({
  default: () => <div data-testid="login-form">LoginForm</div>,
}));

import LoginPage from '@/app/(auth)/login/page';

describe('/login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects suscriptora users to / when they have no callbackUrl context', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'suscriptora' },
    });

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('redirects productora users to /laboratorio', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/laboratorio');
  });

  it('redirects admin users to /admin', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'miguel@test.com', role: 'admin' },
    });

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/admin');
  });

  it('renders the login form for unauthenticated users', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const jsx = await LoginPage();
    render(jsx);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

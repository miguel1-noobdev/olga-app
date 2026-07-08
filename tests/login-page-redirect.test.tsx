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

  it('redirects authenticated users to /blog', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'suscriptora' },
    });

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/blog');
  });

  it('renders the login form for unauthenticated users', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const jsx = await LoginPage();
    render(jsx);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

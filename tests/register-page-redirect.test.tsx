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

vi.mock('@/components/auth/register-form', () => ({
  default: () => <div data-testid="register-form">RegisterForm</div>,
}));

import RegisterPage from '@/app/(auth)/register/page';

describe('/register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects authenticated users to /blog', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'suscriptora' },
    });

    await RegisterPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/blog');
  });

  it('renders the register form for unauthenticated users', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const jsx = await RegisterPage();
    render(jsx);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

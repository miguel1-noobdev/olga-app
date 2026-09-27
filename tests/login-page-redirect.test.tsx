import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

const originalGoogleOAuthEnabled = process.env.GOOGLE_OAUTH_ENABLED;
const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
const originalGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/components/auth/login-form', () => ({
  default: ({ googleEnabled = false }: { googleEnabled?: boolean }) => (
    <div data-testid="login-form" data-google-enabled={String(googleEnabled)}>
      LoginForm
    </div>
  ),
}));

import LoginPage from '@/app/(auth)/login/page';

describe('/login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_OAUTH_ENABLED;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterEach(() => {
    for (const [key, value] of [
      ['GOOGLE_OAUTH_ENABLED', originalGoogleOAuthEnabled],
      ['GOOGLE_CLIENT_ID', originalGoogleClientId],
      ['GOOGLE_CLIENT_SECRET', originalGoogleClientSecret],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
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
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
    });

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/admin');
  });

  it('renders the login form without Google when configuration is incomplete', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const jsx = await LoginPage();
    render(jsx);

    expect(screen.getByTestId('login-form')).toHaveAttribute('data-google-enabled', 'false');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('enables Google only when the complete server configuration is present', async () => {
    process.env.GOOGLE_OAUTH_ENABLED = 'true';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    getServerSessionMock.mockResolvedValue(null);

    const jsx = await LoginPage();
    render(jsx);

    expect(screen.getByTestId('login-form')).toHaveAttribute('data-google-enabled', 'true');
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getServerSessionMock, redirectMock, signOutMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
  signOutMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
}));

import LaboratoryLayout from '@/app/laboratorio/layout';

describe('/laboratorio layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(LaboratoryLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /login'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('redirects authenticated non-staff users to /', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'reader@test.com', role: 'suscriptora' },
    });

    await expect(LaboratoryLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('renders children for productora role', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders children for admin role', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'miguel@test.com', role: 'admin' },
    });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders persistent laboratory navigation for staff', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/laboratorio');
    expect(screen.getByRole('link', { name: /formulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('link', { name: /plants/i })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(screen.getByRole('link', { name: /oils/i })).toHaveAttribute(
      'href',
      '/laboratorio/aceites'
    );
    expect(screen.getByRole('link', { name: /public site/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signOut with the public home callbackUrl when sign out is clicked', async () => {
    const user = userEvent.setup();
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});

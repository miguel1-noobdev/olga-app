import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getCurrentUserMock, redirectMock, signOutMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
  signOutMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

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
    getCurrentUserMock.mockResolvedValue(null);

    await expect(LaboratoryLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /login'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('redirects authenticated non-staff users to /', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'reader@test.com', role: 'suscriptora' });

    await expect(LaboratoryLayout({ children: <div>Protected content</div> })).rejects.toThrow(
      'NEXT_REDIRECT /'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('renders children for productora role', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'olga@test.com', role: 'productora' });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders children for admin role', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'admin@test.com', role: 'admin' });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('renders persistent laboratory navigation for staff', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'olga@test.com', role: 'productora' });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    expect(screen.getByRole('link', { name: /laboratorio final/i })).toHaveAttribute('href', '/laboratorio');
    expect(screen.getByRole('link', { name: /fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('link', { name: /lotes/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes'
    );
    expect(screen.getByRole('link', { name: /mi jardín/i })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(screen.getByRole('link', { name: /mis aceites/i })).toHaveAttribute(
      'href',
      '/laboratorio/aceites'
    );
    expect(screen.getByRole('link', { name: /ver sitio público/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('calls signOut with the public home callbackUrl when sign out is clicked', async () => {
    const user = userEvent.setup();
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', email: 'olga@test.com', role: 'productora' });

    const jsx = await LaboratoryLayout({ children: <div>Protected content</div> });
    render(jsx);

    const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    await user.click(signOutButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});

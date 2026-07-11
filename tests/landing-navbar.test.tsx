import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/landing/navbar';

const { signOutMock, useSessionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
  useSession: useSessionMock,
}));

describe('Landing Navbar', () => {
  it('renders public navigation links for unauthenticated users', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /productos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jardin 2\.0/i })).toBeInTheDocument();
  });

  it('does not render a private entry for unauthenticated users', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(<Navbar />);

    expect(screen.queryByRole('link', { name: /(laboratorio|admin)/i })).not.toBeInTheDocument();
  });

  it('does not render a private entry for suscriptora users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Ana', email: 'ana@test.com', role: 'suscriptora' } },
    });

    render(<Navbar />);

    expect(screen.queryByRole('link', { name: /(laboratorio|admin)/i })).not.toBeInTheDocument();
  });

  it('renders the Laboratorio entry for productora users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com', role: 'productora' } },
    });

    render(<Navbar />);

    const laboratorioLink = screen.getByRole('link', { name: /laboratorio/i });
    expect(laboratorioLink).toBeInTheDocument();
    expect(laboratorioLink).toHaveAttribute('href', '/laboratorio');
  });

  it('renders the Admin entry for admin users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Miguel', email: 'miguel@test.com', role: 'admin' } },
    });

    render(<Navbar />);

    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('keeps public nav links unchanged for staff users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com', role: 'productora' } },
    });

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /productos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jardin 2\.0/i })).toBeInTheDocument();
  });

  it('renders the Laboratorio entry in the mobile menu for productora users', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com', role: 'productora' } },
    });

    const user = userEvent.setup();
    render(<Navbar />);

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuButton);

    const laboratorioLinks = screen.getAllByRole('link', { name: /laboratorio/i });
    expect(laboratorioLinks.length).toBeGreaterThanOrEqual(1);
    expect(laboratorioLinks[0]).toHaveAttribute('href', '/laboratorio');
  });

  it('renders the Admin entry in the mobile menu for admin users', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Miguel', email: 'miguel@test.com', role: 'admin' } },
    });

    const user = userEvent.setup();
    render(<Navbar />);

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuButton);

    const adminLinks = screen.getAllByRole('link', { name: /admin/i });
    expect(adminLinks.length).toBeGreaterThanOrEqual(1);
    expect(adminLinks[0]).toHaveAttribute('href', '/admin');
  });

  it('does not render a private entry in the mobile menu for non-staff users', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Ana', email: 'ana@test.com', role: 'suscriptora' } },
    });

    const user = userEvent.setup();
    render(<Navbar />);

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuButton);

    expect(screen.queryByRole('link', { name: /(laboratorio|admin)/i })).not.toBeInTheDocument();
  });
});

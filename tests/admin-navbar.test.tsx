import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminNavbar from '@/components/admin/admin-navbar';

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
}));

describe('AdminNavbar', () => {
  it('renders navigation links', () => {
    render(<AdminNavbar />);

    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver sitio/i })).toBeInTheDocument();
  });

  it('renders a sign-out button labelled "Salir"', () => {
    render(<AdminNavbar />);

    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
  });

  it('calls signOut with the public home callbackUrl when "Salir" is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminNavbar />);

    const signOutButton = screen.getByRole('button', { name: /salir/i });
    await user.click(signOutButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});

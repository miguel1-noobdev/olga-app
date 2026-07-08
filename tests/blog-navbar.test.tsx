import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogNavbar from '@/components/blog/blog-navbar';

const { signOutMock, useSessionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
  useSession: useSessionMock,
}));

describe('BlogNavbar', () => {
  it('renders navigation links', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(<BlogNavbar />);

    expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument();
  });

  it('renders a sign-out button for authenticated users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
    });

    render(<BlogNavbar />);

    expect(screen.getByText('Olga')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
  });

  it('calls signOut with the public home callbackUrl when "Salir" is clicked', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
    });

    const user = userEvent.setup();
    render(<BlogNavbar />);

    const signOutButton = screen.getByRole('button', { name: /salir/i });
    await user.click(signOutButton);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('does not render sign-out button when unauthenticated', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(<BlogNavbar />);

    expect(screen.queryByRole('button', { name: /salir/i })).not.toBeInTheDocument();
  });
});

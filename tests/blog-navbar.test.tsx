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

  it('renders a landing home link for authenticated users', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
    });

    render(<BlogNavbar />);

    expect(screen.getByText('Olga')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/blog');
    const landingLink = screen.getByRole('link', { name: /esenciales ob/i });
    expect(landingLink).toHaveAttribute('href', '/');
  });

  it('navigates to landing page and does not sign out when landing Esenciales OB is clicked', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
    });

    const user = userEvent.setup();
    render(<BlogNavbar />);

    const landingLink = screen.getByRole('link', { name: /esenciales ob/i });
    expect(landingLink).toHaveAttribute('href', '/');
    await user.click(landingLink);

    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('does not render landing home link when unauthenticated', () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(<BlogNavbar />);

    const allLinks = screen.getAllByRole('link');
    expect(allLinks.some((link) => link.getAttribute('href') === '/')).toBe(false);
  });
});

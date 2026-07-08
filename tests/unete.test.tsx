import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Unete from '@/components/landing/unete';

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
}));

describe('Unete CTA', () => {
  beforeEach(() => {
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a register link for anonymous visitors', () => {
    render(<Unete />);

    const link = screen.getByRole('link', { name: /crear cuenta/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders a button instead of a link for authenticated users', () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
      status: 'authenticated',
    });

    render(<Unete />);

    expect(screen.queryByRole('link', { name: /crear cuenta/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('shows a friendly toast when authenticated users click the CTA and dismisses it automatically', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Olga', email: 'olga@test.com' } },
      status: 'authenticated',
    });

    vi.useFakeTimers();
    render(<Unete />);

    const button = screen.getByRole('button', { name: /crear cuenta/i });
    fireEvent.click(button);

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Ya formás parte de nuestra comunidad');
    expect(toast).toHaveTextContent('Ahora a disfrutar de todo el contenido de mi web');

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

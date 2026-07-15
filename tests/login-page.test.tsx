import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/login-form';

const { signInMock, getSessionMock, useSearchParamsMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  getSessionMock: vi.fn(),
  useSearchParamsMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
  getSession: getSessionMock,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: useSearchParamsMock,
}));

describe('LoginForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    getSessionMock.mockResolvedValue(null);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });
  });

  it('renders email and password inputs', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('renders submit button with text "Iniciar sesión"', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders link to /register', () => {
    render(<LoginForm />);

    const registerLink = screen.getByRole('link', { name: /crear una cuenta/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('does not render a Google sign-in affordance', () => {
    render(<LoginForm />);

    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/continuar con google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^o$/i)).not.toBeInTheDocument();
  });

  it('shows error when fields are empty on submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);

    expect(screen.getByText('Completá todos los campos.')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('calls signIn with credentials when form is submitted', async () => {
    signInMock.mockResolvedValue({ ok: true, error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);

    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      email: 'a@b.com',
      password: 'password123',
      callbackUrl: '/',
      redirect: false,
    });
  });

  it('does not call signIn with google provider', async () => {
    signInMock.mockResolvedValue({ ok: true, error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);

    const googleCalls = signInMock.mock.calls.filter(([provider]) => provider === 'google');
    expect(googleCalls).toHaveLength(0);
  });

  it('navigates to /laboratorio after productora login without callbackUrl', async () => {
    signInMock.mockResolvedValue({ ok: true, error: null });
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'olga@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(window.location.href).toBe('/laboratorio');
  });

  it('navigates to /admin after admin login without callbackUrl', async () => {
    signInMock.mockResolvedValue({ ok: true, error: null });
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(window.location.href).toBe('/admin');
  });

  it('navigates to / after suscriptora login without callbackUrl', async () => {
    signInMock.mockResolvedValue({ ok: true, error: null });
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'suscriptora' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(window.location.href).toBe('/');
  });

  it('preserves callbackUrl when provided', async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({ callbackUrl: '/jardin-digital/lavanda' }),
    );
    signInMock.mockResolvedValue({ ok: true, error: null });
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'suscriptora' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(signInMock).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ callbackUrl: '/jardin-digital/lavanda' }),
    );
    expect(window.location.href).toBe('/jardin-digital/lavanda');
  });
});

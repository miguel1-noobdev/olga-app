import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '@/components/auth/register-form';

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: useRouterMock,
}));

describe('RegisterForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push: vi.fn() });
    global.fetch = vi.fn();
  });

  it('renders email, password and confirm password inputs', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('renders submit button with text "Crear cuenta"', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('renders link to /login', () => {
    render(<RegisterForm />);

    const loginLink = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('does not render a Google sign-up affordance', () => {
    render(<RegisterForm />);

    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/continuar con google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^o$/i)).not.toBeInTheDocument();
  });

  it('shows error when fields are empty on submit', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(screen.getByText('Completá todos los campos.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'different-password');

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'short');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'short');

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls register API and redirects to /login?registered=true on success', async () => {
    const pushMock = vi.fn();
    useRouterMock.mockReturnValue({ push: pushMock });
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: 'User created successfully', userId: 'user-1' }),
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    });
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/login?registered=true');
  });

  it('shows backend error message when registration fails', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'A user with this email already exists' }),
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(await screen.findByText('A user with this email already exists')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    let resolveFetch: (value: {
      ok: boolean;
      json: () => Promise<{ message: string }>;
    }) => void;

    const fetchPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{ message: string }>;
    }>((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as Mock).mockImplementation(() => fetchPromise);

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeDisabled();

    resolveFetch!({ ok: true, json: async () => ({ message: 'User created successfully' }) });

    await screen.findByRole('button', { name: /crear cuenta/i });
  });
});

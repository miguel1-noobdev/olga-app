import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '@/components/auth/register-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('RegisterForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('announces rejected registration and re-enables the form without exposing backend details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('MongoServerSelectionError mongodb://secret-host/app')));
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error. Intentá de nuevo.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});

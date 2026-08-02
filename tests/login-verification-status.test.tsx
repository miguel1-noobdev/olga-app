import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginForm from '@/components/auth/login-form';

const { searchParamsMock } = vi.hoisted(() => ({ searchParamsMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: searchParamsMock }));
vi.mock('next-auth/react', () => ({ getSession: vi.fn(), signIn: vi.fn() }));

describe('LoginForm registration status', () => {
  it('explains that registration requires verification', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams('registered=true'));
    render(<LoginForm />);
    expect(screen.getByRole('status')).toHaveTextContent('Revisá tu email para verificar la cuenta antes de iniciar sesión.');
  });
  it('confirms verification without exposing the token', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams('verified=true'));
    render(<LoginForm />);
    expect(screen.getByRole('status')).toHaveTextContent('Email verificado. Ya podés iniciar sesión.');
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
  });
});

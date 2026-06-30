import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// NOTE: These tests will be implemented once the login page is built.
// For now they serve as a TODO list / specification for T-007.

describe('LoginPage component spec', () => {
  // This file will contain actual component tests.
  // Placeholder assertions until component is implemented.
  // After implementation, the tests below will be replaced with real ones.

  it.todo('renders email input with label');
  it.todo('renders password input with label');
  it.todo('renders submit button with text "Iniciar sesión"');
  it.todo('renders link to /register');
  it.todo('calls signIn with email and password on submit');
  it.todo('shows error for invalid credentials');
  it.todo('shows loading state during submission');
  it.todo('reads error from URL search params');
  it.todo('validates email format client-side');
  it.todo('validates password not empty client-side');
});
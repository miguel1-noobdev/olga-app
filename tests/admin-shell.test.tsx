import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

import AdminHeader from '@/components/admin/admin-header';
import AdminShell from '@/components/admin/admin-shell';

describe('AdminShell', () => {
  it('renders its protected content and Dashboard Admin navigation', () => {
    render(
      <AdminShell>
        <p>Temporary article tooling</p>
      </AdminShell>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contenido' })).toHaveAttribute('href', '/admin/contenido');
    expect(screen.getByRole('link', { name: 'Salud del sistema' })).toHaveAttribute('href', '/admin/salud');
    expect(screen.getByText('Temporary article tooling')).toBeInTheDocument();
  });

  it('keeps the public-site escape navigation separate from Admin routes', () => {
    render(
      <AdminShell>
        <p>Protected content</p>
      </AdminShell>
    );

    expect(screen.getByRole('link', { name: 'Ver sitio' })).toHaveAttribute('href', '/');
  });
});

describe('AdminHeader', () => {
  it('renders without errors', () => {
    render(<AdminHeader />);

    expect(screen.getByRole('heading', { name: 'Dashboard Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver sitio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});

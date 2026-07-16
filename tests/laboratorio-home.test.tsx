import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import LaboratoryHomePage from '@/app/laboratorio/page';

describe('/laboratorio home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a new formula link pointing to the new formula route', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryHomePage();
    render(jsx);

    expect(screen.getByRole('link', { name: /nueva fórmula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/nueva'
    );
  });

  it('renders the laboratory hub for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryHomePage();
    render(jsx);

    expect(screen.getByText('Hola, Olga')).toBeInTheDocument();
    expect(
      screen.getByText('Panel de operaciones del laboratorio')
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('link', { name: /lotes/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes'
    );
    expect(screen.getByRole('link', { name: /mi jardín/i })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(screen.getByRole('link', { name: /mis aceites/i })).toHaveAttribute(
      'href',
      '/laboratorio/aceites'
    );
  });
});

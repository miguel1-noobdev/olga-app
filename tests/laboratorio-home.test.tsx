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

    expect(screen.getByRole('link', { name: /new formula/i })).toHaveAttribute(
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

    expect(screen.getByText('Laboratory')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Private workspace for production planning and raw material consultation.'
      )
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /formulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('link', { name: /lotes/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes'
    );
    expect(screen.getByRole('link', { name: /plants/i })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(screen.getByRole('link', { name: /oils/i })).toHaveAttribute(
      'href',
      '/laboratorio/aceites'
    );
  });

  it('displays the suggested workflow hint', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryHomePage();
    render(jsx);

    expect(screen.getByText('Suggested flow')).toBeInTheDocument();
    expect(
      screen.getByText(/work starts from a formula/i)
    ).toBeInTheDocument();
  });
});

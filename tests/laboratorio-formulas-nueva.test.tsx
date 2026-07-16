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
  useRouter: () => ({ back: vi.fn() }),
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

import LaboratoryNewFormulaPage from '@/app/laboratorio/formulas/nueva/page';

describe('/laboratorio/formulas/nueva page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the new formula form for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryNewFormulaPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: /nueva fórmula/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('textbox', { name: /nombre del producto/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /código de fórmula/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar fórmula/i })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

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

  it('renders the approved compact formula layout and required labels', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const jsx = await LaboratoryNewFormulaPage();
    render(jsx);

    expect(screen.getByText('Definición de parámetros, ingredientes y procedimientos de elaboración.'))
      .toBeInTheDocument();
    expect(screen.getByRole('group', { name: /información básica de la fórmula/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /fases e ingredientes/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /evaluación del producto/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /inci \/ propiedades/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^código de fórmula$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^versión$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de elaboración/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lote objetivo \(g\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^estado$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^objetivo del producto$/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /observaciones finales/i })).toBeInTheDocument();

    const form = screen.getByRole('form');
    expect(form).toHaveClass('w-full', 'min-w-0');
    expect(screen.getByRole('group', { name: /procedimiento/i }).parentElement).toHaveClass(
      'grid',
      'grid-cols-1',
      'lg:grid-cols-2'
    );
    expect(screen.getByRole('group', { name: /prueba de uso/i }).parentElement).toHaveClass(
      'grid',
      'grid-cols-1',
      'lg:grid-cols-2'
    );

    const actionButtons = screen.getAllByRole('button', { name: /cancelar|guardar fórmula/i });
    expect(actionButtons[0]).toHaveAccessibleName('Cancelar');
    expect(actionButtons[0]).toHaveAttribute('type', 'button');
    expect(actionButtons[1]).toHaveAccessibleName('Guardar fórmula');
    expect(actionButtons[1]).toHaveAttribute('type', 'submit');
  });
});

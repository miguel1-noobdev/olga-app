import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FormulaFormProps } from '@/components/laboratorio/formula-form';

const { formulaFormPropsMock } = vi.hoisted(() => ({
  formulaFormPropsMock: vi.fn(),
}));

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const notFoundMock = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: () => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
    findById: findByIdMock,
  })),
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

vi.mock('@/app/laboratorio/formulas/[id]/edit/actions', () => ({
  submitFormulaUpdate: vi.fn(),
}));

vi.mock('@/components/laboratorio/formula-form', async () => {
  const actual = await vi.importActual<typeof import('@/components/laboratorio/formula-form')>(
    '@/components/laboratorio/formula-form'
  );

  return {
    ...actual,
    default: (props: FormulaFormProps) => {
      formulaFormPropsMock(props);
      return React.createElement(actual.default, props);
    },
  };
});

import LaboratoryEditFormulaPage from '@/app/laboratorio/formulas/[id]/edit/page';

const mockFormula = {
  id: 'formula-1',
  productName: 'Crema de lavanda',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  productType: 'crema',
  status: 'validated',
  targetBatchGrams: 500,
  formulaCreatedAt: '2026-01-15T00:00:00.000Z',
  productObjectives: ['hidratante', 'calmante'],
  phases: {
    aqueous: [{ ingredient: 'Agua purificada', grams: 300 }],
    oil: [
      { ingredient: 'Aceite de almendras', grams: 100 },
      { ingredient: 'Manteca de karite', grams: 50 },
    ],
    actives: [{ ingredient: 'Extracto de lavanda', grams: 10 }],
  },
  procedureSteps: [
    { stepNumber: 1, instruction: 'Mezclar la fase acuosa.' },
    { stepNumber: 2, instruction: 'Agregar la fase oleosa lentamente.' },
  ],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/formulas/[id]/edit page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when formula does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(null);

    await expect(LaboratoryEditFormulaPage({ params: { id: 'unknown' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders the edit formula form for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryEditFormulaPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: /editar fórmula/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /editar fórmula/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('button', { name: /actualizar fórmula/i })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('prefills the form with the existing formula values', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryEditFormulaPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('textbox', { name: /nombre del producto/i })).toHaveValue('Crema de lavanda');
    expect(screen.getByRole('textbox', { name: /código de fórmula/i })).toHaveValue('CF-001');
    expect(screen.getByRole('textbox', { name: /tipo de producto/i })).toHaveValue('crema');
    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toHaveValue(500);
    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveValue('validated');

    expect(screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase acuosa/i })).toHaveValue(
      'Agua purificada'
    );
    expect(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase acuosa/i })
    ).toHaveValue(300);

    expect(screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase oleosa/i })).toHaveValue(
      'Aceite de almendras'
    );
    expect(screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase oleosa/i })).toHaveValue(
      100
    );
    expect(screen.getByRole('textbox', { name: /nombre del ingrediente 2 de la fase oleosa/i })).toHaveValue(
      'Manteca de karite'
    );
    expect(screen.getByRole('spinbutton', { name: /gramos del ingrediente 2 de la fase oleosa/i })).toHaveValue(
      50
    );

    expect(
      screen.getByRole('textbox', { name: /nombre del ingrediente 1 de la fase activos/i })
    ).toHaveValue('Extracto de lavanda');
    expect(
      screen.getByRole('spinbutton', { name: /gramos del ingrediente 1 de la fase activos/i })
    ).toHaveValue(10);

    expect(screen.getByRole('textbox', { name: /paso de procedimiento 1/i })).toHaveValue(
      'Mezclar la fase acuosa.'
    );
    expect(screen.getByRole('textbox', { name: /paso de procedimiento 2/i })).toHaveValue(
      'Agregar la fase oleosa lentamente.'
    );
  });

  it('passes a callable bound submit action to FormulaForm', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryEditFormulaPage({ params: { id: 'formula-1' } });
    render(jsx);

    const submitFormula = formulaFormPropsMock.mock.lastCall?.[0]?.submitFormula;

    expect(submitFormula).toEqual(expect.any(Function));
    expect(submitFormula.name).toMatch(/^bound /);
  });
});

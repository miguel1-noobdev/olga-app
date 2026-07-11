import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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

    expect(screen.getByRole('heading', { name: 'Edit formula', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /edit formula/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to formulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(screen.getByRole('button', { name: /update formula/i })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('prefills the form with the existing formula values', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryEditFormulaPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('textbox', { name: /product name/i })).toHaveValue('Crema de lavanda');
    expect(screen.getByRole('textbox', { name: /formula code/i })).toHaveValue('CF-001');
    expect(screen.getByRole('textbox', { name: /product type/i })).toHaveValue('crema');
    expect(screen.getByRole('spinbutton', { name: /target batch/i })).toHaveValue(500);
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('validated');

    expect(screen.getByRole('textbox', { name: /aqueous phase ingredient 1 name/i })).toHaveValue(
      'Agua purificada'
    );
    expect(
      screen.getByRole('spinbutton', { name: /aqueous phase ingredient 1 grams/i })
    ).toHaveValue(300);

    expect(screen.getByRole('textbox', { name: /oil phase ingredient 1 name/i })).toHaveValue(
      'Aceite de almendras'
    );
    expect(screen.getByRole('spinbutton', { name: /oil phase ingredient 1 grams/i })).toHaveValue(
      100
    );
    expect(screen.getByRole('textbox', { name: /oil phase ingredient 2 name/i })).toHaveValue(
      'Manteca de karite'
    );
    expect(screen.getByRole('spinbutton', { name: /oil phase ingredient 2 grams/i })).toHaveValue(
      50
    );

    expect(
      screen.getByRole('textbox', { name: /actives phase ingredient 1 name/i })
    ).toHaveValue('Extracto de lavanda');
    expect(
      screen.getByRole('spinbutton', { name: /actives phase ingredient 1 grams/i })
    ).toHaveValue(10);

    expect(screen.getByRole('textbox', { name: /procedure step 1/i })).toHaveValue(
      'Mezclar la fase acuosa.'
    );
    expect(screen.getByRole('textbox', { name: /procedure step 2/i })).toHaveValue(
      'Agregar la fase oleosa lentamente.'
    );
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

import LaboratoryCreateLotPage from '@/app/laboratorio/formulas/[id]/lotes/nuevo/page';

const mockFormula = {
  id: 'formula-1',
  productName: 'Crema de lavanda',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  productType: 'crema',
  status: 'validated',
  targetBatchGrams: 500,
  formulaCreatedAt: '2026-01-15T00:00:00.000Z',
  productObjectives: [],
  procedureSteps: [],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/formulas/[id]/lotes/nuevo page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when the source formula does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(null);

    await expect(LaboratoryCreateLotPage({ params: { id: 'unknown' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('redirects to the formula detail when the source formula is not validated', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, status: 'draft' });

    await expect(LaboratoryCreateLotPage({ params: { id: 'formula-1' } })).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/formulas/formula-1'
    );
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/laboratorio/formulas/formula-1');
  });

  it('renders source formula context and a back link for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryCreateLotPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: /create lot/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Crema de lavanda')).toBeInTheDocument();
    expect(screen.getByText('CF-001 — v1.0')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to formula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1'
    );
  });

  it('uses the actual formula id in the back link and reflects its target batch', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      id: 'formula-99',
      targetBatchGrams: 1000,
    });

    const jsx = await LaboratoryCreateLotPage({ params: { id: 'formula-99' } });
    render(jsx);

    expect(screen.getByText('1000 g')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to formula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-99'
    );
  });

  it('renders the minimum lot form with the correct default values', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryCreateLotPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('form', { name: /create lot/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /target batch/i })).toHaveValue(500);
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('planned');
    expect(screen.getByLabelText(/planned at/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /operational observations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create lot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('lets Olga change the target batch and status before submission', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryCreateLotPage({ params: { id: 'formula-1' } });
    render(jsx);

    const targetBatchInput = screen.getByRole('spinbutton', { name: /target batch/i });
    await userEvent.clear(targetBatchInput);
    await userEvent.type(targetBatchInput, '750');
    expect(targetBatchInput).toHaveValue(750);

    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.selectOptions(statusSelect, 'in_progress');
    expect(statusSelect).toHaveValue('in_progress');
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { findByIdMock: findFormulaByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const { findByIdMock: findLotByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const { submitLotEditUpdateMock } = vi.hoisted(() => ({
  submitLotEditUpdateMock: vi.fn(),
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
    findById: findFormulaByIdMock,
  })),
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    findById: findLotByIdMock,
  })),
}));

vi.mock('@/app/laboratorio/formulas/[id]/lotes/[lotId]/edit/actions', () => ({
  submitLotEditUpdate: submitLotEditUpdateMock,
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

import LaboratoryEditLotPage from '@/app/laboratorio/formulas/[id]/lotes/[lotId]/edit/page';

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

const mockLot = {
  id: 'lot-1',
  formulaId: 'formula-1',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  lotNumber: 1,
  lotCode: 'CF-001-L001',
  status: 'planned',
  targetBatchGrams: 500,
  formulaSnapshot: {
    productName: 'Crema de lavanda',
    productType: 'crema',
    targetBatchGrams: 500,
    procedureSteps: [],
  },
  followUp: { entries: [] },
  plannedAt: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/formulas/[id]/lotes/[lotId]/edit page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without page-level auth because laboratorio layout owns access control', async () => {
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryEditLotPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('form', { name: /edit lot/i })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('calls notFound when the source formula does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(null);

    await expect(
      LaboratoryEditLotPage({ params: { id: 'unknown', lotId: 'lot-1' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('calls notFound when the lot does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(null);

    await expect(
      LaboratoryEditLotPage({ params: { id: 'formula-1', lotId: 'unknown' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('calls notFound when the lot belongs to a different formula', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      formulaId: 'formula-other',
    });

    await expect(
      LaboratoryEditLotPage({ params: { id: 'formula-1', lotId: 'lot-1' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders the operational edit form and a back link for a valid lot', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryEditLotPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: /Edit lot/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /edit lot/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('planned');
    expect(screen.getByLabelText(/planned at/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/started at/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/completed at/i)).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /operational observations/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to lot/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1/lotes/lot-1'
    );
  });

  it('uses the actual ids in repository calls', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue({ ...mockFormula, id: 'formula-99' });
    findLotByIdMock.mockResolvedValue({ ...mockLot, id: 'lot-7', formulaId: 'formula-99' });

    await LaboratoryEditLotPage({ params: { id: 'formula-99', lotId: 'lot-7' } });

    expect(findFormulaByIdMock).toHaveBeenCalledWith('formula-99');
    expect(findLotByIdMock).toHaveBeenCalledWith('lot-7');
  });

  it('submits the form through the wired server action', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);
    submitLotEditUpdateMock.mockResolvedValue({ success: true });

    const jsx = await LaboratoryEditLotPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /status/i }),
      'in_progress'
    );
    await userEvent.type(screen.getByLabelText(/planned at/i), '2026-04-20');
    await userEvent.type(screen.getByLabelText(/started at/i), '2026-04-21');
    await userEvent.type(screen.getByLabelText(/completed at/i), '2026-04-22');
    await userEvent.type(
      screen.getByRole('textbox', { name: /operational observations/i }),
      'Use fresh distilled water'
    );

    const submitButton = screen.getByRole('button', { name: /update lot/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(submitLotEditUpdateMock).toHaveBeenCalledTimes(1));
    expect(submitLotEditUpdateMock).toHaveBeenCalledWith(
      'lot-1',
      expect.objectContaining({
        status: 'in_progress',
        plannedAt: '2026-04-20',
        startedAt: '2026-04-21',
        completedAt: '2026-04-22',
        operationalObservations: 'Use fresh distilled water',
      })
    );
  });
});

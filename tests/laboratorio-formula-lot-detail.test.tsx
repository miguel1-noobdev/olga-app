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

const { submitLotFollowUpMock } = vi.hoisted(() => ({
  submitLotFollowUpMock: vi.fn(),
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

vi.mock('@/app/laboratorio/formulas/[id]/lotes/[lotId]/actions', () => ({
  submitLotFollowUp: submitLotFollowUpMock,
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

import LaboratoryLotDetailPage from '@/app/laboratorio/formulas/[id]/lotes/[lotId]/page';

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
    technicalData: {
      productionTemperatureCelsius: 65,
      mixingTimeMinutes: 20,
      preservative: 'Cosgard',
    },
  },
  followUp: { entries: [] },
  plannedAt: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/formulas/[id]/lotes/[lotId] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when the source formula does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(null);

    await expect(
      LaboratoryLotDetailPage({ params: { id: 'unknown', lotId: 'lot-1' } })
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
      LaboratoryLotDetailPage({ params: { id: 'formula-1', lotId: 'unknown' } })
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
      LaboratoryLotDetailPage({ params: { id: 'formula-1', lotId: 'lot-1' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders lot context and a back link for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: /CF-001-L001/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Source formula')).toBeInTheDocument();
    expect(screen.getAllByText('Crema de lavanda').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CF-001 — v1.0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to formula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1'
    );
  });

  it('renders an edit lot link pointing to the nested edit route', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('link', { name: /edit lot/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1/lotes/lot-1/edit'
    );
  });

  it('uses the actual ids in repository calls and back link', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue({ ...mockFormula, id: 'formula-99' });
    findLotByIdMock.mockResolvedValue({ ...mockLot, id: 'lot-7', formulaId: 'formula-99' });

    await LaboratoryLotDetailPage({ params: { id: 'formula-99', lotId: 'lot-7' } });

    expect(findFormulaByIdMock).toHaveBeenCalledWith('formula-99');
    expect(findLotByIdMock).toHaveBeenCalledWith('lot-7');
  });

  it('renders lot identity and status', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: /CF-001-L001/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Lot number 1')).toBeInTheDocument();
    expect(screen.getAllByText('Planned')).toHaveLength(2);
  });

  it('renders operational fields with formatted dates', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      targetBatchGrams: 750,
      plannedAt: '2026-02-01T00:00:00.000Z',
      startedAt: '2026-02-05T00:00:00.000Z',
      completedAt: '2026-02-10T00:00:00.000Z',
      operationalObservations: 'Worked in a clean environment.',
    });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByText('Target batch')).toBeInTheDocument();
    expect(screen.getByText('750 g')).toBeInTheDocument();
    expect(screen.getByText('Planned at')).toBeInTheDocument();
    expect(screen.getByText('Feb 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Started at')).toBeInTheDocument();
    expect(screen.getByText('Feb 5, 2026')).toBeInTheDocument();
    expect(screen.getByText('Completed at')).toBeInTheDocument();
    expect(screen.getByText('Feb 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('Operational observations')).toBeInTheDocument();
    expect(screen.getByText('Worked in a clean environment.')).toBeInTheDocument();
  });

  it('renders the frozen formula snapshot', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      formulaSnapshot: {
        productName: 'Crema de lavanda',
        productType: 'crema',
        targetBatchGrams: 500,
        phases: {
          aqueous: [{ ingredient: 'Aqua', grams: 300 }],
          oil: [{ ingredient: 'Sweet almond oil', grams: 150 }],
          actives: [{ ingredient: 'Lavender essential oil', grams: 10 }],
        },
        procedureSteps: [
          { stepNumber: 1, instruction: 'Heat aqueous phase.' },
          { stepNumber: 2, instruction: 'Combine and homogenize.' },
        ],
      },
    });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: /Formula snapshot/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Aqueous phase')).toBeInTheDocument();
    expect(screen.getByText('Aqua')).toBeInTheDocument();
    expect(screen.getByText('300 g')).toBeInTheDocument();
    expect(screen.getByText('Oil phase')).toBeInTheDocument();
    expect(screen.getByText('Sweet almond oil')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
    expect(screen.getByText('Actives')).toBeInTheDocument();
    expect(screen.getByText('Lavender essential oil')).toBeInTheDocument();
    expect(screen.getByText('10 g')).toBeInTheDocument();
    expect(screen.getByText('Heat aqueous phase.')).toBeInTheDocument();
    expect(screen.getByText('Combine and homogenize.')).toBeInTheDocument();
  });

  it('renders production instructions from the frozen technical data', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { name: /Production instructions/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText('Production temperature')).toBeInTheDocument();
    expect(screen.getByText('65 °C')).toBeInTheDocument();
    expect(screen.getByText('Mixing time')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('Preservative')).toBeInTheDocument();
    expect(screen.getByText('Cosgard')).toBeInTheDocument();
  });

  it('renders partial production instructions when only some technical data is frozen', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      formulaSnapshot: {
        ...mockLot.formulaSnapshot,
        technicalData: {
          preservative: 'Geogard',
        },
      },
    });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByText('Preservative')).toBeInTheDocument();
    expect(screen.getByText('Geogard')).toBeInTheDocument();
    expect(screen.queryByText('Production temperature')).not.toBeInTheDocument();
    expect(screen.queryByText('Mixing time')).not.toBeInTheDocument();
  });

  it('renders an empty production instructions message when no technical data is frozen', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      formulaSnapshot: {
        ...mockLot.formulaSnapshot,
        technicalData: undefined,
      },
    });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { name: /Production instructions/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText('No production instructions registered.')).toBeInTheDocument();
  });

  it('renders follow-up entries', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue({
      ...mockLot,
      followUp: {
        entries: [
          { date: '2026-03-01T00:00:00.000Z', note: 'Texture stable.' },
          { date: '2026-04-01T00:00:00.000Z', note: 'Color slightly darker.' },
        ],
      },
    });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { name: 'Follow-up', level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText('Texture stable.')).toBeInTheDocument();
    expect(screen.getByText('Color slightly darker.')).toBeInTheDocument();
    expect(screen.getByText('Mar 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Apr 1, 2026')).toBeInTheDocument();
  });

  it('handles empty optional sections gracefully', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(screen.getByText('No phases registered.')).toBeInTheDocument();
    expect(screen.getByText('No procedure steps registered.')).toBeInTheDocument();
    expect(screen.getByText('No follow-up entries registered.')).toBeInTheDocument();
    expect(screen.getAllByText('Not set').length).toBeGreaterThanOrEqual(3);
  });

  it('renders an add follow-up entry section with the entry form', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { name: /add follow-up entry/i, level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('form', { name: /add follow-up entry/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
  });

  it('submits the follow-up form through the wired server action', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findFormulaByIdMock.mockResolvedValue(mockFormula);
    findLotByIdMock.mockResolvedValue(mockLot);
    submitLotFollowUpMock.mockResolvedValue({ success: true });

    const jsx = await LaboratoryLotDetailPage({
      params: { id: 'formula-1', lotId: 'lot-1' },
    });
    render(jsx);

    await userEvent.type(screen.getByLabelText(/date/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /note/i }),
      'Texture is stable.'
    );

    const submitButton = screen.getByRole('button', { name: /add entry/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(submitLotFollowUpMock).toHaveBeenCalledTimes(1));
    expect(submitLotFollowUpMock).toHaveBeenCalledWith(
      'lot-1',
      expect.objectContaining({
        date: '2026-05-10',
        note: 'Texture is stable.',
      })
    );
  });
});

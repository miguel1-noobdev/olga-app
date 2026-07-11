import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const { findByFormulaIdMock } = vi.hoisted(() => ({
  findByFormulaIdMock: vi.fn(),
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
    findById: findByIdMock,
  })),
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    findByFormulaId: findByFormulaIdMock,
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

import LaboratoryFormulaDetailPage from '@/app/laboratorio/formulas/[id]/page';
import { LotRecord } from '@/lib/db/repository/lot';

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
  technicalData: {
    finalPh: 5.5,
    productionTemperatureCelsius: 65,
    mixingTimeMinutes: 20,
    preservative: 'Cosgard',
    fragrance: 'Lavanda',
    color: 'Blanco cremoso',
  },
  productEvaluation: {
    texture: 'Cremosa',
    color: 'Blanco',
    smell: 'Lavanda',
    viscosity: 'Media',
    absorption: 'Rapida',
    foam: 'N/A',
    stability: 'Estable',
  },
  useTest: {
    approxExpirationDate: '2026-07-15T00:00:00.000Z',
    entries: [
      { date: '2026-02-01T00:00:00.000Z', note: 'Primera prueba: buena textura.' },
    ],
  },
  inci: {
    function: 'Hidratante',
    emulsionType: 'O/W',
    dosage: 'Uso diario',
    temperature: 'Ambiente',
    compatibility: 'Compatible con la mayoria de activos',
    inconveniences: 'Ninguna conocida',
    ph: '5.0 - 6.0',
  },
  finalObservations: 'Conservar en lugar fresco y seco.',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

function createMockLot(overrides: Partial<LotRecord> = {}): LotRecord {
  return {
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
    ...overrides,
  };
}

describe('/laboratorio/formulas/[id] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findByFormulaIdMock.mockResolvedValue([]);
  });

  it('calls notFound when formula does not exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(null);

    await expect(LaboratoryFormulaDetailPage({ params: { id: 'unknown' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('renders formula identity and back link for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Crema de lavanda', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('CF-001 — v1.0 — crema')).toBeInTheDocument();
    expect(screen.getByText('Validated')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to formulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
  });

  it('renders a create lot link pointing to the nested lot create route', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const createLotLink = screen.getByRole('link', { name: /create lot/i });
    expect(createLotLink).toBeInTheDocument();
    expect(createLotLink).toHaveAttribute('href', '/laboratorio/formulas/formula-1/lotes/nuevo');
  });

  it('uses the actual formula id in the create lot link', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, id: 'formula-42' });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-42' } });
    render(jsx);

    expect(screen.getByRole('link', { name: /create lot/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-42/lotes/nuevo'
    );
  });

  it('does not render the create lot link when formula is not validated', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, status: 'draft' });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.queryByRole('link', { name: /create lot/i })).not.toBeInTheDocument();
  });

  it('loads lots for the current formula', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });

    expect(findByFormulaIdMock).toHaveBeenCalledWith('formula-1');
  });

  it('renders an empty lot section when the formula has no lots', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);
    findByFormulaIdMock.mockResolvedValue([]);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Lots' })).toBeInTheDocument();
    expect(screen.getByText('No lots registered for this formula.')).toBeInTheDocument();
  });

  it('renders the lot list with basic fields', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);
    findByFormulaIdMock.mockResolvedValue([
      createMockLot({
        id: 'lot-1',
        lotNumber: 1,
        lotCode: 'CF-001-L001',
        status: 'planned',
        targetBatchGrams: 500,
      }),
      createMockLot({
        id: 'lot-2',
        lotNumber: 2,
        lotCode: 'CF-001-L002',
        status: 'in_progress',
        targetBatchGrams: 750,
      }),
    ]);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Lots' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('CF-001-L001')).toBeInTheDocument();
    expect(scoped.getByText('CF-001-L002')).toBeInTheDocument();
    expect(scoped.getByText('Planned')).toBeInTheDocument();
    expect(scoped.getByText('In progress')).toBeInTheDocument();
    expect(scoped.getByText(/Lot number 1/)).toBeInTheDocument();
    expect(scoped.getByText(/Lot number 2/)).toBeInTheDocument();
    expect(scoped.getByText(/500 g target/)).toBeInTheDocument();
    expect(scoped.getByText(/750 g target/)).toBeInTheDocument();
  });

  it('renders a detail link for each lot using the nested route', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);
    findByFormulaIdMock.mockResolvedValue([
      createMockLot({
        id: 'lot-1',
        lotNumber: 1,
        lotCode: 'CF-001-L001',
        status: 'planned',
        targetBatchGrams: 500,
      }),
      createMockLot({
        id: 'lot-2',
        lotNumber: 2,
        lotCode: 'CF-001-L002',
        status: 'in_progress',
        targetBatchGrams: 750,
      }),
    ]);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Lots' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByRole('link', { name: 'CF-001-L001' })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1/lotes/lot-1'
    );
    expect(scoped.getByRole('link', { name: 'CF-001-L002' })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1/lotes/lot-2'
    );
  });

  it('uses the actual formula id in lot detail links', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, id: 'formula-42' });
    findByFormulaIdMock.mockResolvedValue([
      createMockLot({ id: 'lot-5', lotNumber: 5, lotCode: 'CF-001-L005' }),
    ]);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-42' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Lots' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByRole('link', { name: 'CF-001-L005' })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-42/lotes/lot-5'
    );
  });

  it('renders lot dates when present', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);
    findByFormulaIdMock.mockResolvedValue([
      createMockLot({
        plannedAt: '2026-02-01T00:00:00.000Z',
        startedAt: '2026-02-05T00:00:00.000Z',
        completedAt: '2026-02-10T00:00:00.000Z',
      }),
    ]);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByText(/Planned: Feb 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Started: Feb 5, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Completed: Feb 10, 2026/)).toBeInTheDocument();
  });

  it('renders every lot status label without crashing', async () => {
    const statuses: LotRecord['status'][] = ['planned', 'in_progress', 'completed', 'cancelled'];

    for (const status of statuses) {
      vi.clearAllMocks();
      getServerSessionMock.mockResolvedValue({
        user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
      });
      findByIdMock.mockResolvedValue(mockFormula);
      findByFormulaIdMock.mockResolvedValue([createMockLot({ status })]);

      const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
      const { unmount } = render(jsx);

      expect(screen.getByRole('heading', { name: 'Lots' })).toBeInTheDocument();
      unmount();
    }
  });

  it('renders objectives section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Objectives' })).toBeInTheDocument();
    expect(screen.getByText('hidratante')).toBeInTheDocument();
    expect(screen.getByText('calmante')).toBeInTheDocument();
  });

  it('renders phases and ingredients section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Phases and ingredients' })).toBeInTheDocument();
    expect(screen.getByText('Aqueous phase')).toBeInTheDocument();
    expect(screen.getByText('Agua purificada')).toBeInTheDocument();
    expect(screen.getByText('300 g')).toBeInTheDocument();
    expect(screen.getByText('Oil phase')).toBeInTheDocument();
    expect(screen.getByText('Aceite de almendras')).toBeInTheDocument();
    expect(screen.getByText('100 g')).toBeInTheDocument();
    expect(screen.getByText('Manteca de karite')).toBeInTheDocument();
    expect(screen.getByText('50 g')).toBeInTheDocument();
    expect(screen.getByText('Actives')).toBeInTheDocument();
    expect(screen.getByText('Extracto de lavanda')).toBeInTheDocument();
    expect(screen.getByText('10 g')).toBeInTheDocument();
  });

  it('renders procedure section with numbered steps', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Procedure' })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Mezclar la fase acuosa.')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Agregar la fase oleosa lentamente.')).toBeInTheDocument();
  });

  it('renders technical data section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Technical data' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('Final pH')).toBeInTheDocument();
    expect(scoped.getByText('5.5')).toBeInTheDocument();
    expect(scoped.getByText('Production temperature')).toBeInTheDocument();
    expect(scoped.getByText('65°C')).toBeInTheDocument();
    expect(scoped.getByText('Mixing time')).toBeInTheDocument();
    expect(scoped.getByText('20 min')).toBeInTheDocument();
    expect(scoped.getByText('Preservative')).toBeInTheDocument();
    expect(scoped.getByText('Cosgard')).toBeInTheDocument();
    expect(scoped.getByText('Fragrance')).toBeInTheDocument();
    expect(scoped.getByText('Lavanda')).toBeInTheDocument();
    expect(scoped.getByText('Color')).toBeInTheDocument();
    expect(scoped.getByText('Blanco cremoso')).toBeInTheDocument();
  });

  it('renders product evaluation section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Product evaluation' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('Texture')).toBeInTheDocument();
    expect(scoped.getByText('Cremosa')).toBeInTheDocument();
    expect(scoped.getByText('Absorption')).toBeInTheDocument();
    expect(scoped.getByText('Rapida')).toBeInTheDocument();
  });

  it('renders use test section with expiration and entries', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Use test' })).toBeInTheDocument();
    expect(screen.getByText('Approximate expiration')).toBeInTheDocument();
    expect(screen.getByText('Jul 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('Feb 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Primera prueba: buena textura.')).toBeInTheDocument();
  });

  it('renders INCI section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'INCI' })).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Hidratante')).toBeInTheDocument();
    expect(screen.getByText('Emulsion type')).toBeInTheDocument();
    expect(screen.getByText('O/W')).toBeInTheDocument();
    expect(screen.getByText('pH')).toBeInTheDocument();
    expect(screen.getByText('5.0 - 6.0')).toBeInTheDocument();
  });

  it('renders final observations section', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Final observations' })).toBeInTheDocument();
    expect(screen.getByText('Conservar en lugar fresco y seco.')).toBeInTheDocument();
  });

  it('renders empty section messages when optional data is missing', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      productObjectives: [],
      phases: undefined,
      procedureSteps: [],
      technicalData: undefined,
      productEvaluation: undefined,
      useTest: undefined,
      inci: undefined,
      finalObservations: '',
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByText('No objectives registered.')).toBeInTheDocument();
    expect(screen.getByText('No phases registered.')).toBeInTheDocument();
    expect(screen.getByText('No procedure steps registered.')).toBeInTheDocument();
    expect(screen.getByText('No technical data registered.')).toBeInTheDocument();
    expect(screen.getByText('No product evaluation registered.')).toBeInTheDocument();
    expect(screen.getByText('No use test data registered.')).toBeInTheDocument();
    expect(screen.getByText('No INCI data registered.')).toBeInTheDocument();
    expect(screen.getByText('No final observations registered.')).toBeInTheDocument();
  });

  it('renders only the phases that have ingredients', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      phases: {
        aqueous: [{ ingredient: 'Agua purificada', grams: 300 }],
        oil: [],
        actives: undefined,
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Phases and ingredients' })).toBeInTheDocument();
    expect(screen.getByText('Aqueous phase')).toBeInTheDocument();
    expect(screen.getByText('Agua purificada')).toBeInTheDocument();
    expect(screen.queryByText('Oil phase')).not.toBeInTheDocument();
    expect(screen.queryByText('Actives')).not.toBeInTheDocument();
  });

  it('renders only provided technical data fields', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      technicalData: {
        finalPh: 5.5,
        mixingTimeMinutes: 20,
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Technical data' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByText('Final pH')).toBeInTheDocument();
    expect(scoped.getByText('5.5')).toBeInTheDocument();
    expect(scoped.getByText('Mixing time')).toBeInTheDocument();
    expect(scoped.getByText('20 min')).toBeInTheDocument();
    expect(scoped.queryByText('Production temperature')).not.toBeInTheDocument();
    expect(scoped.queryByText('Preservative')).not.toBeInTheDocument();
  });

  it('renders only provided product evaluation fields', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      productEvaluation: {
        texture: 'Cremosa',
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'Product evaluation' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByText('Texture')).toBeInTheDocument();
    expect(scoped.getByText('Cremosa')).toBeInTheDocument();
    expect(scoped.queryByText('Color')).not.toBeInTheDocument();
    expect(scoped.queryByText('Smell')).not.toBeInTheDocument();
  });

  it('renders only provided INCI fields', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      inci: {
        function: 'Hidratante',
        ph: '5.0 - 6.0',
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const section = screen.getByRole('heading', { name: 'INCI' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByText('Function')).toBeInTheDocument();
    expect(scoped.getByText('Hidratante')).toBeInTheDocument();
    expect(scoped.getByText('pH')).toBeInTheDocument();
    expect(scoped.getByText('5.0 - 6.0')).toBeInTheDocument();
    expect(scoped.queryByText('Emulsion type')).not.toBeInTheDocument();
  });

  it('renders use test with only expiration date', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      useTest: {
        approxExpirationDate: '2026-07-15T00:00:00.000Z',
        entries: [],
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByText('Approximate expiration')).toBeInTheDocument();
    expect(screen.getByText('Jul 15, 2026')).toBeInTheDocument();
    expect(screen.queryByText('Entries')).not.toBeInTheDocument();
  });

  it('renders use test with only entries', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      useTest: {
        approxExpirationDate: null,
        entries: [{ date: '2026-02-01T00:00:00.000Z', note: 'Primera prueba.' }],
      },
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.queryByText('Approximate expiration')).not.toBeInTheDocument();
    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('Feb 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Primera prueba.')).toBeInTheDocument();
  });

  it('treats whitespace-only final observations as empty', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({
      ...mockFormula,
      finalObservations: '   \n  ',
    });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByText('No final observations registered.')).toBeInTheDocument();
  });

  it('renders every status label without crashing', async () => {
    const statuses = ['draft', 'testing', 'validated', 'archived', 'discarded'] as const;

    for (const status of statuses) {
      vi.clearAllMocks();
      getServerSessionMock.mockResolvedValue({
        user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
      });
      findByIdMock.mockResolvedValue({ ...mockFormula, status });

      const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
      const { unmount } = render(jsx);

      expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
      unmount();
    }
  });
});

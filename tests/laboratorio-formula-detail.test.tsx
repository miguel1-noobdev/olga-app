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
    expect(screen.getByText('Validada')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByText('15 ene 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
  });

  it('renders a create Lote link pointing to canonical creation with formula context', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    const createLotLink = screen.getByRole('link', { name: /crear lote/i });
    expect(createLotLink).toBeInTheDocument();
    expect(createLotLink).toHaveAttribute('href', '/laboratorio/lotes/nuevo?formulaId=formula-1');
  });

  it('uses the actual formula id in the create lot link', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, id: 'formula-42' });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-42' } });
    render(jsx);

    expect(screen.getByRole('link', { name: /crear lote/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/nuevo?formulaId=formula-42'
    );
  });

  it('does not render the create lot link when formula is not validated', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue({ ...mockFormula, status: 'draft' });

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.queryByRole('link', { name: /crear lote/i })).not.toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Lotes' })).toBeInTheDocument();
    expect(screen.getByText('No hay lotes registrados para esta fórmula.')).toBeInTheDocument();
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

    const section = screen.getByRole('heading', { name: 'Lotes' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('CF-001-L001')).toBeInTheDocument();
    expect(scoped.getByText('CF-001-L002')).toBeInTheDocument();
    expect(scoped.getByText('Planeado')).toBeInTheDocument();
    expect(scoped.getByText('En progreso')).toBeInTheDocument();
    expect(scoped.getByText(/Lote n\.º 1/)).toBeInTheDocument();
    expect(scoped.getByText(/Lote n\.º 2/)).toBeInTheDocument();
    expect(scoped.getByText(/500 g de objetivo/)).toBeInTheDocument();
    expect(scoped.getByText(/750 g de objetivo/)).toBeInTheDocument();
  });

  it('renders a canonical detail link for each Lote', async () => {
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

    const section = screen.getByRole('heading', { name: 'Lotes' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByRole('link', { name: 'CF-001-L001' })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/lot-1'
    );
    expect(scoped.getByRole('link', { name: 'CF-001-L002' })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/lot-2'
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

    const section = screen.getByRole('heading', { name: 'Lotes' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByRole('link', { name: 'CF-001-L005' })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/lot-5'
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

    expect(screen.getByText(/Planificado: 1 feb 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Iniciado: 5 feb 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Completado: 10 feb 2026/)).toBeInTheDocument();
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

      expect(screen.getByRole('heading', { name: 'Lotes' })).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Fases e ingredientes' })).toBeInTheDocument();
    expect(screen.getByText('Fase acuosa')).toBeInTheDocument();
    expect(screen.getByText('Agua purificada')).toBeInTheDocument();
    expect(screen.getByText('300 g')).toBeInTheDocument();
    expect(screen.getByText('Fase oleosa')).toBeInTheDocument();
    expect(screen.getByText('Aceite de almendras')).toBeInTheDocument();
    expect(screen.getByText('100 g')).toBeInTheDocument();
    expect(screen.getByText('Manteca de karite')).toBeInTheDocument();
    expect(screen.getByText('50 g')).toBeInTheDocument();
    expect(screen.getByText('Activos')).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Procedimiento' })).toBeInTheDocument();
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

    const section = screen.getByRole('heading', { name: 'Datos técnicos' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('pH final')).toBeInTheDocument();
    expect(scoped.getByText('5.5')).toBeInTheDocument();
    expect(scoped.getByText('Temperatura de producción')).toBeInTheDocument();
    expect(scoped.getByText('65°C')).toBeInTheDocument();
    expect(scoped.getByText('Tiempo de mezcla')).toBeInTheDocument();
    expect(scoped.getByText('20 min')).toBeInTheDocument();
    expect(scoped.getByText('Conservante')).toBeInTheDocument();
    expect(scoped.getByText('Cosgard')).toBeInTheDocument();
    expect(scoped.getByText('Fragancia')).toBeInTheDocument();
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

    const section = screen.getByRole('heading', { name: 'Evaluación del producto' }).closest('section');
    expect(section).toBeInTheDocument();

    const scoped = within(section as HTMLElement);
    expect(scoped.getByText('Textura')).toBeInTheDocument();
    expect(scoped.getByText('Cremosa')).toBeInTheDocument();
    expect(scoped.getByText('Absorción')).toBeInTheDocument();
    expect(scoped.getByText('Rapida')).toBeInTheDocument();
  });

  it('renders use test section with expiration and entries', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });
    findByIdMock.mockResolvedValue(mockFormula);

    const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Prueba de uso' })).toBeInTheDocument();
    expect(screen.getByText('Vencimiento aproximado')).toBeInTheDocument();
    expect(screen.getByText('15 jul 2026')).toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('1 feb 2026')).toBeInTheDocument();
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
    expect(screen.getByText('Función')).toBeInTheDocument();
    expect(screen.getByText('Hidratante')).toBeInTheDocument();
    expect(screen.getByText('Tipo de emulsión')).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Observaciones finales' })).toBeInTheDocument();
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

    expect(screen.getByText('No hay objetivos registrados.')).toBeInTheDocument();
    expect(screen.getByText('No hay fases registradas.')).toBeInTheDocument();
    expect(screen.getByText('No hay pasos de procedimiento registrados.')).toBeInTheDocument();
    expect(screen.getByText('No hay datos técnicos registrados.')).toBeInTheDocument();
    expect(screen.getByText('No hay evaluación del producto registrada.')).toBeInTheDocument();
    expect(screen.getByText('No hay datos de prueba de uso registrados.')).toBeInTheDocument();
    expect(screen.getByText('No hay datos INCI registrados.')).toBeInTheDocument();
    expect(screen.getByText('No hay observaciones finales registradas.')).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Fases e ingredientes' })).toBeInTheDocument();
    expect(screen.getByText('Fase acuosa')).toBeInTheDocument();
    expect(screen.getByText('Agua purificada')).toBeInTheDocument();
    expect(screen.queryByText('Fase oleosa')).not.toBeInTheDocument();
    expect(screen.queryByText('Activos')).not.toBeInTheDocument();
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

    const section = screen.getByRole('heading', { name: 'Datos técnicos' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByText('pH final')).toBeInTheDocument();
    expect(scoped.getByText('5.5')).toBeInTheDocument();
    expect(scoped.getByText('Tiempo de mezcla')).toBeInTheDocument();
    expect(scoped.getByText('20 min')).toBeInTheDocument();
    expect(scoped.queryByText('Temperatura de producción')).not.toBeInTheDocument();
    expect(scoped.queryByText('Conservante')).not.toBeInTheDocument();
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

    const section = screen.getByRole('heading', { name: 'Evaluación del producto' }).closest('section');
    const scoped = within(section as HTMLElement);

    expect(scoped.getByText('Textura')).toBeInTheDocument();
    expect(scoped.getByText('Cremosa')).toBeInTheDocument();
    expect(scoped.queryByText('Color')).not.toBeInTheDocument();
    expect(scoped.queryByText('Olor')).not.toBeInTheDocument();
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

    expect(scoped.getByText('Función')).toBeInTheDocument();
    expect(scoped.getByText('Hidratante')).toBeInTheDocument();
    expect(scoped.getByText('pH')).toBeInTheDocument();
    expect(scoped.getByText('5.0 - 6.0')).toBeInTheDocument();
    expect(scoped.queryByText('Tipo de emulsión')).not.toBeInTheDocument();
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

    expect(screen.getByText('Vencimiento aproximado')).toBeInTheDocument();
    expect(screen.getByText('15 jul 2026')).toBeInTheDocument();
    expect(screen.queryByText('Entradas')).not.toBeInTheDocument();
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

    expect(screen.queryByText('Vencimiento aproximado')).not.toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('1 feb 2026')).toBeInTheDocument();
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

    expect(screen.getByText('No hay observaciones finales registradas.')).toBeInTheDocument();
  });

  it('renders every status label without crashing', async () => {
    const statuses: Array<{ status: typeof mockFormula.status; label: string }> = [
      { status: 'draft', label: 'Borrador' },
      { status: 'testing', label: 'En pruebas' },
      { status: 'validated', label: 'Validada' },
      { status: 'archived', label: 'Archivada' },
      { status: 'discarded', label: 'Descartada' },
    ];

    for (const { status, label } of statuses) {
      vi.clearAllMocks();
      getServerSessionMock.mockResolvedValue({
        user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
      });
      findByIdMock.mockResolvedValue({ ...mockFormula, status });

      const jsx = await LaboratoryFormulaDetailPage({ params: { id: 'formula-1' } });
      const { unmount } = render(jsx);

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});

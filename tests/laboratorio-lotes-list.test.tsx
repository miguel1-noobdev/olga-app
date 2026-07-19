import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const { findAllMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    findAll: findAllMock,
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

import LaboratoryLotesPage from '@/app/laboratorio/lotes/page';

const lots = [
  {
    id: 'lot-1',
    formulaId: 'formula-1',
    formulaCode: 'CF-001',
    formulaVersion: '1.0',
    lotNumber: 1,
    lotCode: 'CF-001-L001',
    status: 'in_production' as const,
    targetBatchGrams: 500,
    formulaSnapshot: {
      productName: 'Lavender cream',
      productType: 'cream',
      targetBatchGrams: 500,
      procedureSteps: [],
    },
    followUp: { entries: [] },
    plannedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
];

describe('/laboratorio/lotes page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Stitch title, subtitle, and prominent new lot CTA', async () => {
    findAllMock.mockResolvedValue([]);

    render(await LaboratoryLotesPage());

    const pageHeading = screen.getByRole('heading', { name: 'Producción de lotes', level: 1 });
    expect(pageHeading).toBeInTheDocument();
    expect(pageHeading).toHaveClass(
      'text-primary',
      'drop-shadow-[0_0_12px_rgba(150,248,255,0.25)]'
    );
    expect(
      screen.getByText('Seguí cada lote de producción desde un solo espacio de trabajo.')
    ).toBeInTheDocument();
    const newLotLink = screen.getByRole('link', { name: 'Nuevo lote' });
    expect(newLotLink).toHaveAttribute('href', '/laboratorio/lotes/nuevo');
    expect(newLotLink).toHaveClass(
      'rounded-full',
      'bg-surface-container',
      'border-secondary',
      'text-secondary'
    );
  });

  it('lists all lots from the repository with canonical detail links', async () => {
    findAllMock.mockResolvedValue(lots);

    const jsx = await LaboratoryLotesPage();
    render(jsx);

    expect(findAllMock).toHaveBeenCalledOnce();
    const lotList = screen.getByRole('list', { name: 'Lista de lotes' });
    expect(lotList).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    const lotLink = screen.getByRole('link', {
      name: /ver detalles de cf-001-l001/i,
    });
    expect(lotLink).toHaveAttribute('href', '/laboratorio/lotes/lot-1');
    expect(within(lotLink).getByText('Fórmula de origen')).toBeInTheDocument();
    expect(within(lotLink).getByText('Lavender cream')).toBeInTheDocument();
    expect(within(lotLink).getByText('Número de lote')).toBeInTheDocument();
    expect(within(lotLink).getByText('1', { exact: true })).toBeInTheDocument();
    expect(within(lotLink).getByText('Lote objetivo')).toBeInTheDocument();
    expect(within(lotLink).getByText('500 g')).toBeInTheDocument();
    expect(within(lotLink).getByText('En producción')).toBeInTheDocument();
    expect(within(lotLink).getByText('Detalle de lote')).toBeInTheDocument();
    expect(within(lotLink).getByText('Ver detalle')).toBeInTheDocument();
  });

  it('renders the canonical empty state when no lots exist', async () => {
    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryLotesPage();
    render(jsx);

    const emptyState = screen.getByRole('region', { name: 'Estado de lotes' });
    expect(emptyState).toHaveClass(
      'border-primary/40',
      'shadow-[0_0_24px_rgba(150,248,255,0.12)]'
    );
    expect(
      within(emptyState).getByRole('heading', {
        name: 'No hay lotes registrados todavía',
        level: 2,
      })
    ).toBeInTheDocument();
    expect(
      within(emptyState).getByText(
        'Los lotes aparecerán aquí cuando se creen desde una fórmula validada.'
      )
    ).toBeInTheDocument();
  });

  it.each([
    ['in_production', 'En producción', 'border-l-secondary', 'bg-secondary/15'],
    ['finalized', 'Finalizado', 'border-l-primary', 'bg-primary/15'],
    ['discarded', 'Descartado', 'border-l-error', 'bg-error/15'],
  ] as const)('renders %s lots with a status-aware accent and badge', async (status, label, accent, badge) => {
    findAllMock.mockResolvedValue([{ ...lots[0], status }]);

    render(await LaboratoryLotesPage());

    const lotLink = screen.getByRole('link', {
      name: /ver detalles de cf-001-l001/i,
    });
    expect(lotLink).toHaveClass('border-l-4', accent);
    expect(within(lotLink).getByText(label)).toHaveClass(badge);
  });
});

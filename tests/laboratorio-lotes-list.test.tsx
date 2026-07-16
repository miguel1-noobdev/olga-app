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
    status: 'planned' as const,
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

  it('lists all lots from the repository with canonical detail links', async () => {
    findAllMock.mockResolvedValue(lots);

    const jsx = await LaboratoryLotesPage();
    render(jsx);

    expect(findAllMock).toHaveBeenCalledOnce();
    const lotLink = screen.getByRole('link', {
      name: /ver detalles de cf-001-l001/i,
    });
    expect(lotLink).toHaveAttribute('href', '/laboratorio/lotes/lot-1');
    expect(within(lotLink).getByText('Lavender cream')).toBeInTheDocument();
    expect(within(lotLink).getByText('Planeado')).toBeInTheDocument();
  });

  it('renders the canonical empty state when no lots exist', async () => {
    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryLotesPage();
    render(jsx);

    expect(screen.getByText('No hay lotes registrados todavía')).toBeInTheDocument();
    expect(
      screen.getByText('Los lotes aparecerán aquí cuando se creen desde una fórmula validada.')
    ).toBeInTheDocument();
  });
});

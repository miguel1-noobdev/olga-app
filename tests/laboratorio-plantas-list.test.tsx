import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { findAllMock } = vi.hoisted(() => ({
  findAllMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: vi.fn(() => ({
    findAll: findAllMock,
  })),
}));

import LaboratoryPlantsPage from '@/app/laboratorio/plantas/page';

function buildPlant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plant-1',
    commonName: 'Lavanda',
    scientificName: 'Lavandula angustifolia Mill.',
    slug: 'lavandula-angustifolia-mill',
    species: 'Lavandula angustifolia',
    family: 'Lamiaceae',
    usedParts: ['Flores', 'Sumidades floridas'],
    compounds: [{ name: 'Linalool', percentage: '25-38%' }],
    properties: { oral: ['Ansiolítico'], topical: ['Cicatrizante'] },
    contraindications: ['Hipersensibilidad'],
    availableExtracts: [{ type: 'Aceite Esencial' }],
    description: 'Planta aromática',
    internal: {},
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('/laboratorio/plantas page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page without page-level auth because laboratorio layout owns access control', async () => {
    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryPlantsPage();
    render(jsx);

    expect(screen.getByText('No hay plantas registradas todavía')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('reproduces the Stitch list hierarchy and reads plants from PlantRepository', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      buildPlant({
        id: 'plant-1',
        commonName: 'Lavanda',
        scientificName: 'Lavandula angustifolia Mill.',
        family: 'Lamiaceae',
        usedParts: ['Flores', 'Sumidades floridas'],
        availableExtracts: [{ type: 'Aceite Esencial' }],
      }),
      buildPlant({
        id: 'plant-2',
        commonName: 'Manzanilla',
        slug: 'matricaria-chamomilla-l',
        scientificName: 'Matricaria chamomilla L.',
        family: 'Asteraceae',
        usedParts: ['Flores'],
        availableExtracts: [
          { type: 'Aceite Esencial' },
          { type: 'Infusión' },
        ],
      }),
    ]);

    const jsx = await LaboratoryPlantsPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Mi jardín' })).toHaveClass(
      'font-display',
      'text-4xl',
      'lg:text-5xl',
      'text-tertiary'
    );
    expect(
      screen.getByText('Catálogo botánico interno de referencia operativa.')
    ).toBeInTheDocument();
    expect(screen.getByText('2 PLANTAS REGISTRADAS')).toBeInTheDocument();
    expect(screen.getByLabelText('Resumen del catálogo botánico')).toHaveClass(
      'border-l-2',
      'border-primary'
    );
    expect(screen.getByTestId('plant-table-accent')).toHaveClass(
      'bg-gradient-to-r',
      'from-primary',
      'via-tertiary',
      'to-secondary-fixed'
    );

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(3);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      'Nombre común',
      'Nombre científico',
      'Family',
      'Partes usadas',
      'Extractos',
      'Notas',
    ]);

    const firstDataRow = rows[1];
    const firstPlantLink = within(firstDataRow).getAllByRole('link', { name: 'Ver ficha interna de Lavanda' })[0];

    expect(firstPlantLink).toHaveAttribute(
      'href',
      '/laboratorio/plantas/lavandula-angustifolia-mill'
    );
    expect(within(firstDataRow).getByText('Lavanda')).toBeInTheDocument();
    expect(
      within(firstDataRow).getByText('Lavandula angustifolia Mill.')
    ).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Lamiaceae')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Flores, Sumidades floridas')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Aceite Esencial')).toBeInTheDocument();

    const secondDataRow = rows[2];
    expect(
      within(secondDataRow).getAllByRole('link', { name: 'Ver ficha interna de Manzanilla' })[0]
    ).toHaveAttribute('href', '/laboratorio/plantas/matricaria-chamomilla-l');
    expect(within(secondDataRow).getByText('Manzanilla')).toBeInTheDocument();
    expect(
      within(secondDataRow).getByText('Matricaria chamomilla L.')
    ).toBeInTheDocument();
    expect(within(secondDataRow).getByText('Asteraceae')).toBeInTheDocument();
    expect(within(secondDataRow).getByText('Aceite Esencial, Infusión')).toBeInTheDocument();
    expect(screen.getByText('Orden alfabético (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('Datos de sólo lectura')).toBeInTheDocument();
  });

  it('renders internal notes hint only when internal context exists', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      buildPlant({
        id: 'plant-1',
        commonName: 'Lavanda',
        internal: {
          notes: 'Prefiere suelo arenoso y buen drenaje.',
        },
      }),
      buildPlant({
        id: 'plant-2',
        commonName: 'Manzanilla',
        internal: {},
      }),
    ]);

    const jsx = await LaboratoryPlantsPage();
    render(jsx);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('Sí')).toBeInTheDocument();
    expect(within(rows[2]).getByText('—')).toBeInTheDocument();
  });

  it('renders empty state when no plants exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryPlantsPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Mi jardín' })).toBeInTheDocument();
    expect(screen.getByText('0 PLANTAS REGISTRADAS')).toBeInTheDocument();
    expect(screen.getByText('No hay plantas registradas todavía')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cuando incorpores una planta al dominio botánico, aparecerá en este catálogo de consulta.'
      )
    ).toBeInTheDocument();
  });
});

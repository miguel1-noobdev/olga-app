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

vi.mock('@/lib/db/repository/oil', () => ({
  createOilRepository: vi.fn(() => ({
    findAll: findAllMock,
  })),
}));

import LaboratoryOilsPage from '@/app/laboratorio/aceites/page';

describe('/laboratorio/aceites page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page without page-level auth because laboratorio layout owns access control', async () => {
    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    expect(screen.getByText('No oils registered yet')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('renders a back link to the laboratory hub', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    expect(screen.getByRole('link', { name: /back to laboratory/i })).toHaveAttribute(
      'href',
      '/laboratorio'
    );
  });

  it('reads oils from OilRepository and renders them in a table', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      {
        id: 'oil-1',
        name: 'Aceite de almendras dulces',
        inciName: 'Prunus Amygdalus Dulcis Oil',
        hlb: 6.5,
        phase: 'oil',
        recommendedPercentage: 10,
        observations: 'Emoliente suave.',
        notes: 'Comprar orgánico.',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'oil-2',
        name: 'Aceite de jojoba',
        inciName: 'Simmondsia Chinensis Seed Oil',
        hlb: 6.5,
        phase: 'oil',
        recommendedPercentage: null,
        observations: '',
        notes: '',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    expect(screen.getByText('Laboratory — Oils')).toBeInTheDocument();
    expect(screen.getByText('Available oils for formulas')).toBeInTheDocument();
    expect(screen.getByText('2 oils registered')).toBeInTheDocument();

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(3);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      'Name',
      'INCI',
      'HLB',
      'Phase',
      'Recommended %',
      'Observations',
    ]);

    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('Aceite de almendras dulces')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Prunus Amygdalus Dulcis Oil')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('6.5')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Oil')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('10%')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('Emoliente suave.')).toBeInTheDocument();

    const secondDataRow = rows[2];
    expect(within(secondDataRow).getByText('Aceite de jojoba')).toBeInTheDocument();
    expect(within(secondDataRow).getByText('Simmondsia Chinensis Seed Oil')).toBeInTheDocument();
    expect(within(secondDataRow).getAllByText('—')).toHaveLength(2);
  });

  it('truncates long observations and keeps the full text in the title attribute', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const longObservation =
      'Emoliente suave ideal para pieles sensibles. Usar en fase oleosa en concentraciones moderadas.';

    findAllMock.mockResolvedValue([
      {
        id: 'oil-1',
        name: 'Aceite de almendras dulces',
        inciName: 'Prunus Amygdalus Dulcis Oil',
        hlb: 6.5,
        phase: 'oil',
        recommendedPercentage: 10,
        observations: longObservation,
        notes: '',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    ]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    const preview = screen.getByTitle(longObservation);
    expect(preview).toBeInTheDocument();
    expect(preview.textContent).toMatch(/…$/);
    expect(preview.textContent).toHaveLength(61);
  });

  it('renders phase badges for known and unknown phases', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      {
        id: 'oil-1',
        name: 'Aceite de almendras dulces',
        inciName: 'Prunus Amygdalus Dulcis Oil',
        hlb: 6.5,
        phase: 'active',
        recommendedPercentage: 5,
        observations: '',
        notes: '',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'oil-2',
        name: 'Aceite de jojoba',
        inciName: 'Simmondsia Chinensis Seed Oil',
        hlb: 6.5,
        phase: 'unknown-phase',
        recommendedPercentage: null,
        observations: '',
        notes: '',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('unknown-phase')).toBeInTheDocument();
  });

  it('renders empty state when no oils exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryOilsPage();
    render(jsx);

    expect(screen.getByText('No oils registered yet')).toBeInTheDocument();
    expect(
      screen.getByText('Your laboratory oils will appear here once they are created.')
    ).toBeInTheDocument();
  });
});

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

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
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

import LaboratoryFormulasPage from '@/app/laboratorio/formulas/page';

describe('/laboratorio/formulas page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading and a new formula link', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryFormulasPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Fórmulas' })).toBeInTheDocument();
    expect(screen.getByText('Gestión y control de fórmulas en producción')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nueva fórmula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/nueva'
    );
  });

  it('lists formulas with product details and links to detail', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      {
        id: 'formula-1',
        productName: 'Crema de lavanda',
        formulaCode: 'CF-001',
        formulaVersion: '1.0',
        productType: 'crema',
        status: 'draft',
        targetBatchGrams: 500,
        formulaCreatedAt: '2026-01-15T00:00:00.000Z',
        productObjectives: ['hidratante'],
        procedureSteps: [],
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'formula-2',
        productName: 'Aceite de calendula',
        formulaCode: 'CF-002',
        formulaVersion: '2.0',
        productType: 'aceite',
        status: 'validated',
        targetBatchGrams: 250,
        formulaCreatedAt: '2026-02-01T00:00:00.000Z',
        productObjectives: ['nutritivo'],
        procedureSteps: [],
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    const jsx = await LaboratoryFormulasPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Fórmulas' })).toBeInTheDocument();

    const formulaGrid = screen.getByRole('list', { name: /lista de fórmulas/i });
    expect(formulaGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');

    const lavenderCard = screen.getByRole('link', { name: /ver detalles de crema de lavanda/i });
    const calendulaCard = screen.getByRole('link', { name: /ver detalles de aceite de calendula/i });

    expect(within(lavenderCard).getByText('Crema de lavanda')).toBeInTheDocument();
    expect(within(lavenderCard).getByText('CF-001')).toBeInTheDocument();
    expect(within(lavenderCard).getByText('1.0')).toBeInTheDocument();
    expect(within(lavenderCard).getByText('15 ene 2026')).toBeInTheDocument();
    expect(within(lavenderCard).getByText('Borrador')).toBeInTheDocument();
    expect(within(lavenderCard).getByText('edit_note')).toHaveClass('text-tertiary');
    expect(lavenderCard).toHaveAttribute('href', '/laboratorio/formulas/formula-1');

    expect(within(calendulaCard).getByText('Aceite de calendula')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('CF-002')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('2.0')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('1 feb 2026')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('Validada')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('science')).toHaveClass('text-primary');
    expect(calendulaCard).toHaveAttribute('href', '/laboratorio/formulas/formula-2');

    expect(within(lavenderCard).getByText('Ver detalle')).toBeInTheDocument();
    expect(within(calendulaCard).getByText('Ver detalle')).toBeInTheDocument();
  });

  it('renders empty state when no formulas exist', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([]);

    const jsx = await LaboratoryFormulasPage();
    render(jsx);

    expect(screen.getByText('Todavía no hay fórmulas registradas')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tus fórmulas aparecerán aquí cuando las crees. Comienza diseñando un nuevo producto para tu laboratorio.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /crear primera fórmula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/nueva'
    );
  });

  it('renders all status labels without crashing', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    const statuses: Array<{ status: string; label: string }> = [
      { status: 'draft', label: 'Borrador' },
      { status: 'testing', label: 'En pruebas' },
      { status: 'validated', label: 'Validada' },
      { status: 'archived', label: 'Archivada' },
      { status: 'discarded', label: 'Descartada' },
    ];

    findAllMock.mockResolvedValue(
      statuses.map((item, index) => ({
        id: `formula-${index}`,
        productName: `Formula ${item.label}`,
        formulaCode: `CF-00${index + 1}`,
        formulaVersion: '1.0',
        productType: 'crema',
        status: item.status,
        targetBatchGrams: 100,
        formulaCreatedAt: '2026-01-15T00:00:00.000Z',
        productObjectives: [],
        procedureSteps: [],
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      }))
    );

    const jsx = await LaboratoryFormulasPage();
    render(jsx);

    for (const item of statuses) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }

    const statusVisuals = [
      { label: 'Borrador', icon: 'edit_note', iconClass: 'text-tertiary' },
      { label: 'En pruebas', icon: 'biotech', iconClass: 'text-secondary' },
      { label: 'Validada', icon: 'science', iconClass: 'text-primary' },
      { label: 'Archivada', icon: 'archive', iconClass: 'text-on-surface-variant' },
      { label: 'Descartada', icon: 'cancel', iconClass: 'text-error' },
    ];

    for (const item of statusVisuals) {
      const card = screen.getByRole('link', {
        name: new RegExp(`ver detalles de formula ${item.label}`, 'i'),
      });
      expect(within(card).getByText(item.icon)).toHaveClass(item.iconClass);
    }
  });

  it('falls back to "Sin fecha" when formulaCreatedAt is missing', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'olga@test.com', role: 'productora' },
    });

    findAllMock.mockResolvedValue([
      {
        id: 'formula-1',
        productName: 'Formula without date',
        formulaCode: 'CF-001',
        formulaVersion: '1.0',
        productType: 'crema',
        status: 'draft',
        targetBatchGrams: 500,
        formulaCreatedAt: null,
        productObjectives: [],
        procedureSteps: [],
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    ]);

    const jsx = await LaboratoryFormulasPage();
    render(jsx);

    const card = screen.getByRole('link', { name: /ver detalles de formula without date/i });
    expect(within(card).getByText('Sin fecha')).toBeInTheDocument();
  });
});

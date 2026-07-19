import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { findByIdMock, updateMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
  updateMock: vi.fn(),
}));

const { submitLotEditMock } = vi.hoisted(() => ({
  submitLotEditMock: vi.fn(),
}));

const notFoundMock = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({ findById: findByIdMock, update: updateMock })),
}));

vi.mock('@/app/laboratorio/lotes/[lotId]/editar/actions', () => ({
  submitLotEditUpdate: submitLotEditMock,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import LaboratoryLotEditPage from '@/app/laboratorio/lotes/[lotId]/editar/page';

const lot = {
  id: 'lot-1',
  formulaId: 'formula-1',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  lotNumber: 1,
  lotCode: 'CF-001-L001',
  status: 'in_production' as const,
  targetBatchGrams: 500,
  formulaSnapshot: { productName: 'Lavender cream', productType: 'cream', targetBatchGrams: 500, procedureSteps: [] },
  followUp: { entries: [] },
  plannedAt: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/lotes/[lotId]/editar page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders editable production controls for in-production lots', async () => {
    findByIdMock.mockResolvedValue(lot);

    render(await LaboratoryLotEditPage({ params: { lotId: 'lot-1' } }));

    expect(screen.getByRole('form', { name: /editar lote/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toHaveValue(500);
    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: /estado/i })).toBeEnabled();
    expect(screen.getByRole('link', { name: /volver al lote/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/lot-1'
    );
  });

  it('keeps discarded terminal lots read-only', async () => {
    findByIdMock.mockResolvedValue({ ...lot, status: 'discarded' });

    render(await LaboratoryLotEditPage({ params: { lotId: 'lot-1' } }));

    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /estado/i })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /observaciones operativas/i })).toBeDisabled();
  });

  it('keeps all production controls read-only for finalized historical lots', async () => {
    findByIdMock.mockResolvedValue({ ...lot, status: 'finalized' });

    render(await LaboratoryLotEditPage({ params: { lotId: 'lot-1' } }));

    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /estado/i })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /observaciones operativas/i })).toBeDisabled();
  });

  it('returns notFound when the canonical lot does not exist', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(LaboratoryLotEditPage({ params: { lotId: 'missing' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

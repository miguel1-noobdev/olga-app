import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { findByStatusMock, findByIdMock, createMock } = vi.hoisted(() => ({
  findByStatusMock: vi.fn(),
  findByIdMock: vi.fn(),
  createMock: vi.fn(),
}));

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({
    findByStatus: findByStatusMock,
    findById: findByIdMock,
  })),
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({ create: createMock })),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import LaboratoryCreateLotPage from '@/app/laboratorio/lotes/nuevo/page';
import { submitNewLot } from '@/app/laboratorio/lotes/nuevo/actions';

const validatedFormula = {
  id: 'formula-validated',
  productName: 'Lavender cream',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  productType: 'cream',
  status: 'validated' as const,
  targetBatchGrams: 100,
  formulaCreatedAt: '2026-01-15T00:00:00.000Z',
  productObjectives: [],
  procedureSteps: [],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/lotes/nuevo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists only validated formulas and preselects a currently validated formulaId', async () => {
    findByStatusMock.mockResolvedValue([validatedFormula]);

    const jsx = await LaboratoryCreateLotPage({
      searchParams: { formulaId: validatedFormula.id },
    });
    render(jsx);

    expect(findByStatusMock).toHaveBeenCalledWith('validated');
    expect(screen.getByRole('combobox', { name: /fórmula origen/i })).toHaveValue(
      validatedFormula.id
    );
    expect(screen.getByRole('option', { name: /lavender cream/i })).toHaveValue(
      validatedFormula.id
    );
  });

  it('shows an empty state when no validated formulas are available', async () => {
    findByStatusMock.mockResolvedValue([]);

    const jsx = await LaboratoryCreateLotPage({ searchParams: {} });
    render(jsx);

    expect(screen.getByText('No hay fórmulas validadas disponibles para crear un lote.')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: /crear lote/i })).not.toBeInTheDocument();
  });

  it('submits the selected formula and target grams while keeping the initial lot status planned', async () => {
    findByStatusMock.mockResolvedValue([validatedFormula]);
    const jsx = await LaboratoryCreateLotPage({ searchParams: {} });
    render(jsx);

    await userEvent.clear(screen.getByRole('spinbutton', { name: /lote objetivo/i }));
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '200');
    fireEvent.submit(screen.getByRole('form', { name: /crear lote/i }));

    await waitFor(() => {
      expect(findByIdMock).toHaveBeenCalledWith(validatedFormula.id);
    });
  });

  it('rejects submission when the selected formula is no longer validated', async () => {
    findByIdMock.mockResolvedValue({ ...validatedFormula, status: 'draft' });

    const result = await submitNewLot({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
    });

    expect(result).toEqual({
      success: false,
      error: 'La fórmula ya no está validada para la creación de lotes.',
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates a planned lot from the revalidated formula and redirects to canonical detail', async () => {
    findByIdMock.mockResolvedValue(validatedFormula);
    createMock.mockResolvedValue({ id: 'lot-123' });

    await expect(
      submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200 })
    ).rejects.toThrow('NEXT_REDIRECT /laboratorio/lotes/lot-123');

    expect(createMock).toHaveBeenCalledWith({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
      status: 'planned',
    });
  });
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getCurrentUserMock, findByStatusMock, findByIdMock, createMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  findByStatusMock: vi.fn(),
  findByIdMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: pushMock }),
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
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  it('shows validated formula cards with Crear lote links when no formula is selected', async () => {
    findByStatusMock.mockResolvedValue([
      validatedFormula,
      { ...validatedFormula, id: 'formula-draft', productName: 'Draft cream', status: 'draft' },
    ]);

    const jsx = await LaboratoryCreateLotPage({
      searchParams: {},
    });
    render(jsx);

    expect(findByStatusMock).toHaveBeenCalledWith('validated');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nuevo lote/i })).toBeInTheDocument();
    expect(screen.getByText('Lavender cream')).toBeInTheDocument();
    expect(screen.getByText('Validada')).toBeInTheDocument();
    expect(screen.getByText('CF-001')).toBeInTheDocument();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.queryByText('Draft cream')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /crear lote/i })).toHaveAttribute(
      'href',
      `/laboratorio/lotes/nuevo?formulaId=${validatedFormula.id}`
    );
    expect(screen.queryByRole('form', { name: /crear lote/i })).not.toBeInTheDocument();
  });

  it('renders the selected formula context and editable target batch field', async () => {
    findByStatusMock.mockResolvedValue([validatedFormula]);

    const jsx = await LaboratoryCreateLotPage({
      searchParams: { formulaId: validatedFormula.id },
    });
    render(jsx);

    expect(screen.getByRole('form', { name: /crear lote/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nuevo lote/i })).toBeInTheDocument();
    expect(screen.getByText('Lavender cream')).toBeInTheDocument();
    expect(screen.getByText('CF-001')).toBeInTheDocument();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('cream')).toBeInTheDocument();
    expect(screen.getByText('Fórmula validada')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toHaveValue(
      validatedFormula.targetBatchGrams
    );
    expect(screen.getByText(/comienzan en producción/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('falls back to formula selection when the requested formula is stale or unknown', async () => {
    findByStatusMock.mockResolvedValue([validatedFormula]);

    const jsx = await LaboratoryCreateLotPage({
      searchParams: { formulaId: 'formula-no-longer-validated' },
    });
    render(jsx);

    expect(screen.getByRole('link', { name: /crear lote/i })).toHaveAttribute(
      'href',
      `/laboratorio/lotes/nuevo?formulaId=${validatedFormula.id}`
    );
    expect(screen.queryByRole('form', { name: /crear lote/i })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(validatedFormula.targetBatchGrams)).not.toBeInTheDocument();
  });

  it('shows an empty state when no validated formulas are available', async () => {
    findByStatusMock.mockResolvedValue([]);

    const jsx = await LaboratoryCreateLotPage({ searchParams: {} });
    render(jsx);

    expect(screen.getByText('No hay fórmulas validadas disponibles para crear un lote.')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: /crear lote/i })).not.toBeInTheDocument();
  });

  it('submits the selected formula and navigates to the canonical lot detail', async () => {
    findByStatusMock.mockResolvedValue([validatedFormula]);
    findByIdMock.mockResolvedValue(validatedFormula);
    createMock.mockResolvedValue({ id: 'lot-123' });

    const jsx = await LaboratoryCreateLotPage({
      searchParams: { formulaId: validatedFormula.id },
    });
    render(jsx);

    await userEvent.clear(screen.getByRole('spinbutton', { name: /lote objetivo/i }));
    await userEvent.type(screen.getByRole('spinbutton', { name: /lote objetivo/i }), '200');
    fireEvent.submit(screen.getByRole('form', { name: /crear lote/i }));

    await waitFor(() => {
      expect(findByIdMock).toHaveBeenCalledWith(validatedFormula.id);
      expect(createMock).toHaveBeenCalledWith({
        formulaId: validatedFormula.id,
        targetBatchGrams: 200,
        status: 'in_production',
      });
      expect(pushMock).toHaveBeenCalledWith('/laboratorio/lotes/lot-123');
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

  it('creates an in-production lot from the revalidated formula and returns a canonical detail result', async () => {
    findByIdMock.mockResolvedValue(validatedFormula);
    createMock.mockResolvedValue({ id: 'lot-123' });

    await expect(submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200 })).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-123',
    });

    expect(createMock).toHaveBeenCalledWith({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
      status: 'in_production',
    });
  });
});

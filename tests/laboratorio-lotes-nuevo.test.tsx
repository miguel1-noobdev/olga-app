import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getCurrentUserMock, connectToDatabaseMock, findByStatusMock, findByIdMock, createMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
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
  connectToDatabase: connectToDatabaseMock,
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
  id: '507f1f77bcf86cd799439011',
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
       { ...validatedFormula, id: '507f1f77bcf86cd799439012', productName: 'Draft cream', status: 'draft' },
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
        creationRequestId: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      });
      expect(pushMock).toHaveBeenCalledWith('/laboratorio/lotes/lot-123');
    });
  });

  it('rejects submission when the selected formula is no longer validated', async () => {
    findByIdMock.mockResolvedValue({ ...validatedFormula, status: 'draft' });

    const result = await submitNewLot({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
      creationRequestId: 'lot-create-request-stale',
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

    await expect(submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200, creationRequestId: 'lot-create-request-success' })).resolves.toEqual({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-123',
    });

    expect(createMock).toHaveBeenCalledWith({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
      status: 'in_production',
      creationRequestId: 'lot-create-request-success',
    });
  });

  it('returns a stable error when database connection fails', async () => {
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200, creationRequestId: 'lot-create-request-connection' });

    expect(result).toEqual({ success: false, error: 'No se pudo crear el lote. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
    expect(findByIdMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns a stable error when authentication lookup fails', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error('CastError: database connection string'));

    const result = await submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200, creationRequestId: 'lot-create-request-auth' });

    expect(result).toEqual({ success: false, error: 'No se pudo crear el lote. Intentelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('connection string');
  });

  it('rejects missing and malformed creation request IDs before database access', async () => {
    const missing = await submitNewLot({ formulaId: validatedFormula.id, targetBatchGrams: 200 } as never);
    const malformed = await submitNewLot({
      formulaId: validatedFormula.id,
      targetBatchGrams: 200,
      creationRequestId: 'request id with spaces',
    });

    expect(missing).toEqual({ success: false, error: 'Entrada inválida' });
    expect(malformed).toEqual({ success: false, error: 'Entrada inválida' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('announces rejected submissions and re-enables the form', async () => {
    findByIdMock.mockResolvedValue(validatedFormula);
    createMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const jsx = await LaboratoryCreateLotPage({
      searchParams: { formulaId: validatedFormula.id },
    });
    render(jsx);

    const submitButton = screen.getByRole('button', { name: /crear lote/i });
    fireEvent.submit(screen.getByRole('form', { name: /crear lote/i }));

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear el lote. Intentelo de nuevo.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
  });
});

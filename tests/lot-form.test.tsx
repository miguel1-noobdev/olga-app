import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LotForm from '@/components/laboratorio/lot-form';
import { SubmitLotResult, LotFormValues } from '@/lib/lots/lot-form-contract';
import { FormulaRecord } from '@/lib/db/repository/formula';

const submitLotMock = vi.fn<(values: LotFormValues) => Promise<SubmitLotResult>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

const mockFormula: FormulaRecord = {
  id: 'formula-1',
  productName: 'Lavender cream',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  productType: 'cream',
  status: 'validated',
  targetBatchGrams: 500,
  formulaCreatedAt: '2026-01-15T00:00:00.000Z',
  productObjectives: [],
  procedureSteps: [],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('LotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders source formula context and the minimum lot fields', () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    expect(screen.getByRole('form', { name: /crear lote/i })).toBeInTheDocument();
    expect(screen.getByText('Lavender cream')).toBeInTheDocument();
    expect(screen.getByText('CF-001 — v1.0')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toHaveValue(500);
    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveValue('in_production');
    expect(screen.getByLabelText(/planificado el/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /observaciones operativas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear lote/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('does not expose generated identity or snapshot fields as inputs', () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    expect(screen.queryByLabelText(/lot number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lot code/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/formula snapshot/i)).not.toBeInTheDocument();
  });

  it('displays validation errors when target batch is missing', async () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    const targetBatchInput = screen.getByRole('spinbutton', { name: /lote objetivo/i });
    await userEvent.clear(targetBatchInput);

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el lote objetivo debe ser mayor a 0/i)).toBeInTheDocument();
    expect(submitLotMock).not.toHaveBeenCalled();
  });

  it('submits the form when all required fields are valid', async () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    const targetBatchInput = screen.getByRole('spinbutton', { name: /lote objetivo/i });
    await userEvent.clear(targetBatchInput);
    await userEvent.type(targetBatchInput, '750');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /estado/i }), 'finalized');
    await userEvent.type(screen.getByLabelText(/planificado el/i), '2026-04-20');
    await userEvent.type(
      screen.getByRole('textbox', { name: /observaciones operativas/i }),
      'Use fresh water'
    );

    submitLotMock.mockResolvedValue({ success: true });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitLotMock).toHaveBeenCalledTimes(1));
    expect(submitLotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        formulaId: 'formula-1',
        targetBatchGrams: 750,
        status: 'finalized',
        plannedAt: '2026-04-20',
        operationalObservations: 'Use fresh water',
      })
    );
  });

  it('displays field errors returned by the server action', async () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    submitLotMock.mockResolvedValue({
      success: false,
      errors: { targetBatchGrams: 'El servidor dice que el lote es demasiado grande' },
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el servidor dice que el lote es demasiado grande/i)).toBeInTheDocument();
  });

  it('displays a global error when the action fails without field errors', async () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    submitLotMock.mockResolvedValue({
      success: false,
      error: 'El servidor rechazó el lote',
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el servidor rechazó el lote/i)).toBeInTheDocument();
  });

  it('disables the submit button while submitting', async () => {
    render(<LotForm formula={mockFormula} submitLot={submitLotMock} />);

    submitLotMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
    );

    const submitButton = screen.getByRole('button', { name: /crear lote/i });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/creando/i);
  });
});

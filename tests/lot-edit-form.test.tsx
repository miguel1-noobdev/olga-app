import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LotEditForm from '@/components/laboratorio/lot-edit-form';
import {
  SubmitLotEditResult,
  LotEditFormValues,
} from '@/lib/lots/lot-edit-form-contract';

const submitLotEditMock =
  vi.fn<(values: LotEditFormValues) => Promise<SubmitLotEditResult>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

const defaultValues: LotEditFormValues = {
  status: 'planned',
  plannedAt: '',
  startedAt: '',
  completedAt: '',
  operationalObservations: '',
};

describe('LotEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the operational edit fields', () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    expect(
      screen.getByRole('form', { name: /editar lote/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveValue(
      'planned'
    );
    expect(screen.getByLabelText(/planificado el/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/iniciado el/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/completado el/i)).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /observaciones operativas/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar lote/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('exposes only the lifecycle-safe rescaling control among immutable lot fields', () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    expect(screen.getByRole('spinbutton', { name: /lote objetivo/i })).toBeEnabled();
    expect(screen.queryByLabelText(/lot number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lot code/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/formula snapshot/i)).not.toBeInTheDocument();
  });

  it('populates fields from initial values', () => {
    render(
      <LotEditForm
        initialValues={{
          status: 'in_progress',
          plannedAt: '2026-04-15',
          startedAt: '2026-04-16',
          completedAt: '2026-04-17',
          operationalObservations: 'Use fresh water',
        }}
        submitLotEdit={submitLotEditMock}
      />
    );

    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveValue(
      'in_progress'
    );
    expect(screen.getByLabelText(/planificado el/i)).toHaveValue('2026-04-15');
    expect(screen.getByLabelText(/iniciado el/i)).toHaveValue('2026-04-16');
    expect(screen.getByLabelText(/completado el/i)).toHaveValue('2026-04-17');
    expect(
      screen.getByRole('textbox', { name: /observaciones operativas/i })
    ).toHaveValue('Use fresh water');
  });

  it('displays validation errors when initial values are invalid', async () => {
    render(
      <LotEditForm
        initialValues={{ ...defaultValues, status: 'invalid-status' as unknown as 'planned' }}
        submitLotEdit={submitLotEditMock}
      />
    );

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/el estado es obligatorio/i)).toBeInTheDocument();
    expect(submitLotEditMock).not.toHaveBeenCalled();
  });

  it('submits the form when all fields are valid', async () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /estado/i }),
      'in_progress'
    );
    await userEvent.type(screen.getByLabelText(/planificado el/i), '2026-04-20');
    await userEvent.type(screen.getByLabelText(/iniciado el/i), '2026-04-21');
    await userEvent.type(screen.getByLabelText(/completado el/i), '2026-04-22');
    await userEvent.type(
      screen.getByRole('textbox', { name: /observaciones operativas/i }),
      'Use fresh water'
    );

    submitLotEditMock.mockResolvedValue({ success: true });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitLotEditMock).toHaveBeenCalledTimes(1));
    expect(submitLotEditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_progress',
        plannedAt: '2026-04-20',
        startedAt: '2026-04-21',
        completedAt: '2026-04-22',
        operationalObservations: 'Use fresh water',
      })
    );
  });

  it('displays field errors returned by the submit handler', async () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    submitLotEditMock.mockResolvedValue({
      success: false,
      errors: { status: 'El servidor dice que el estado es inválido' },
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/el servidor dice que el estado es inválido/i)
    ).toBeInTheDocument();
  });

  it('displays a global error when the submit handler fails without field errors', async () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    submitLotEditMock.mockResolvedValue({
      success: false,
      error: 'El servidor rechazó la actualización',
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/el servidor rechazó la actualización/i)
    ).toBeInTheDocument();
  });

  it('disables the submit button while submitting', async () => {
    render(
      <LotEditForm
        initialValues={defaultValues}
        submitLotEdit={submitLotEditMock}
      />
    );

    submitLotEditMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
    );

    const submitButton = screen.getByRole('button', { name: /actualizar lote/i });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/actualizando/i);
  });
});

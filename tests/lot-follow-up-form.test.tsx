import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LotFollowUpForm from '@/components/laboratorio/lot-follow-up-form';
import {
  SubmitLotFollowUpResult,
  LotFollowUpFormValues,
} from '@/lib/lots/lot-follow-up-form-contract';

const submitFollowUpEntryMock =
  vi.fn<(values: LotFollowUpFormValues) => Promise<SubmitLotFollowUpResult>>();
const { routerPushMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

describe('LotFollowUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the date and note fields', () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    expect(
      screen.getByRole('form', { name: /agregar entrada de seguimiento/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nota/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar entrada/i })).toBeInTheDocument();
  });

  it('populates fields from initial values', () => {
    render(
      <LotFollowUpForm
        initialValues={{ date: '2026-05-10', note: 'Initial note.' }}
        submitFollowUpEntry={submitFollowUpEntryMock}
      />
    );

    expect(screen.getByLabelText(/fecha/i)).toHaveValue('2026-05-10');
    expect(screen.getByRole('textbox', { name: /nota/i })).toHaveValue(
      'Initial note.'
    );
  });

  it('displays validation errors for empty fields', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/la fecha es obligatoria/i)).toBeInTheDocument();
    expect(await screen.findByText(/la nota es obligatoria/i)).toBeInTheDocument();
    expect(submitFollowUpEntryMock).not.toHaveBeenCalled();
  });

  it('submits the form when all fields are valid', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/fecha/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /nota/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-1',
    });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() =>
      expect(submitFollowUpEntryMock).toHaveBeenCalledTimes(1)
    );
    expect(submitFollowUpEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-05-10',
        note: 'Texture is stable.',
      })
    );
    expect(routerPushMock).toHaveBeenCalledWith('/laboratorio/lotes/lot-1');
  });

  it('displays field errors returned by the submit handler', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/fecha/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /nota/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({
      success: false,
      errors: { note: 'El servidor dice que la nota es demasiado larga' },
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/el servidor dice que la nota es demasiado larga/i)
    ).toBeInTheDocument();
  });

  it('displays a global error when the submit handler fails without field errors', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/fecha/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /nota/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({
      success: false,
      error: 'El servidor rechazó la entrada',
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/el servidor rechazó la entrada/i)
    ).toBeInTheDocument();
  });

  it('disables the submit button while submitting', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/fecha/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /nota/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                redirectTo: '/laboratorio/lotes/lot-1',
              }),
            50
          )
        )
    );

    const submitButton = screen.getByRole('button', { name: /agregar entrada/i });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/agregando/i);
  });

  it('announces rejected submissions and re-enables the form', async () => {
    render(
      <LotFollowUpForm
        initialValues={{ date: '2026-05-10', note: 'Texture is stable.' }}
        submitFollowUpEntry={submitFollowUpEntryMock}
      />
    );
    submitFollowUpEntryMock.mockRejectedValueOnce(new Error('CastError mongodb://secret-host/app'));

    const submitButton = screen.getByRole('button', { name: /agregar entrada/i });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo agregar la entrada de seguimiento. Intentá de nuevo.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
  });

  it('preserves the same request ID across a retry', async () => {
    submitFollowUpEntryMock
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ success: true, redirectTo: '/laboratorio/lotes/lot-1' });
    render(
      <LotFollowUpForm
        initialValues={{ date: '2026-05-10', note: 'Texture is stable.' }}
        submitFollowUpEntry={submitFollowUpEntryMock}
      />
    );

    const form = screen.getByRole('form', { name: /agregar entrada de seguimiento/i });
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.submit(form);
    await waitFor(() => expect(submitFollowUpEntryMock).toHaveBeenCalledTimes(2));

    const firstRequestId = submitFollowUpEntryMock.mock.calls[0][0].requestId;
    const secondRequestId = submitFollowUpEntryMock.mock.calls[1][0].requestId;
    expect(firstRequestId).toBeDefined();
    expect(firstRequestId).toBe(secondRequestId);
  });
});

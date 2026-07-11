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

describe('LotFollowUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the date and note fields', () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    expect(
      screen.getByRole('form', { name: /add follow-up entry/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
  });

  it('populates fields from initial values', () => {
    render(
      <LotFollowUpForm
        initialValues={{ date: '2026-05-10', note: 'Initial note.' }}
        submitFollowUpEntry={submitFollowUpEntryMock}
      />
    );

    expect(screen.getByLabelText(/date/i)).toHaveValue('2026-05-10');
    expect(screen.getByRole('textbox', { name: /note/i })).toHaveValue(
      'Initial note.'
    );
  });

  it('displays validation errors for empty fields', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    fireEvent.submit(screen.getByRole('form'));

    expect(await screen.findByText(/date is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/note is required/i)).toBeInTheDocument();
    expect(submitFollowUpEntryMock).not.toHaveBeenCalled();
  });

  it('submits the form when all fields are valid', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/date/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /note/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({ success: true });

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
  });

  it('displays field errors returned by the submit handler', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/date/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /note/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({
      success: false,
      errors: { note: 'Server says note is too long' },
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/server says note is too long/i)
    ).toBeInTheDocument();
  });

  it('displays a global error when the submit handler fails without field errors', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/date/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /note/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockResolvedValue({
      success: false,
      error: 'Server rejected the entry',
    });

    fireEvent.submit(screen.getByRole('form'));

    expect(
      await screen.findByText(/server rejected the entry/i)
    ).toBeInTheDocument();
  });

  it('disables the submit button while submitting', async () => {
    render(<LotFollowUpForm submitFollowUpEntry={submitFollowUpEntryMock} />);

    await userEvent.type(screen.getByLabelText(/date/i), '2026-05-10');
    await userEvent.type(
      screen.getByRole('textbox', { name: /note/i }),
      'Texture is stable.'
    );

    submitFollowUpEntryMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 50)
        )
    );

    const submitButton = screen.getByRole('button', { name: /add entry/i });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent(/adding/i);
  });
});

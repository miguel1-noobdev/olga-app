import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LotCreationForm, { type LotCreationValues, type SubmitLotCreationResult } from '@/components/laboratorio/lot-creation-form';

const submitLotMock = vi.fn<(values: LotCreationValues) => Promise<SubmitLotCreationResult>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const formula = {
  id: '507f1f77bcf86cd799439011',
  productName: 'Lavender cream',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  productType: 'cream',
  status: 'validated' as const,
  targetBatchGrams: 500,
  formulaCreatedAt: '2026-01-15T00:00:00.000Z',
  productObjectives: [],
  procedureSteps: [],
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('LotCreationForm', () => {
  it('preserves the same request ID across a retry', async () => {
    submitLotMock
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ success: true, redirectTo: '/laboratorio/lotes/lot-1' });
    render(<LotCreationForm formula={formula} submitLot={submitLotMock} />);

    const form = screen.getByRole('form', { name: /crear lote/i });
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.submit(form);
    await waitFor(() => expect(submitLotMock).toHaveBeenCalledTimes(2));

    const firstRequestId = submitLotMock.mock.calls[0][0].creationRequestId;
    const secondRequestId = submitLotMock.mock.calls[1][0].creationRequestId;
    expect(firstRequestId).toBeDefined();
    expect(firstRequestId).toBe(secondRequestId);
  });
});

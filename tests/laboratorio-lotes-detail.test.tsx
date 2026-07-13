import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const { submitLotFollowUpMock } = vi.hoisted(() => ({
  submitLotFollowUpMock: vi.fn(),
}));

const notFoundMock = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    findById: findByIdMock,
  })),
}));

vi.mock('@/app/laboratorio/lotes/[lotId]/actions', () => ({
  submitLotFollowUp: submitLotFollowUpMock,
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

import LaboratoryLotDetailPage from '@/app/laboratorio/lotes/[lotId]/page';

const lot = {
  id: 'lot-1',
  formulaId: 'formula-1',
  formulaCode: 'CF-001',
  formulaVersion: '1.0',
  lotNumber: 1,
  lotCode: 'CF-001-L001',
  status: 'planned' as const,
  targetBatchGrams: 500,
  formulaSnapshot: {
    productName: 'Lavender cream',
    productType: 'cream',
    targetBatchGrams: 500,
    procedureSteps: [{ stepNumber: 1, instruction: 'Blend the phases.' }],
  },
  followUp: { entries: [{ date: '2026-03-01T00:00:00.000Z', note: 'Stable texture.' }] },
  plannedAt: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

describe('/laboratorio/lotes/[lotId] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitLotFollowUpMock.mockResolvedValue({ success: true });
  });

  it('returns notFound when the canonical lot does not exist', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(
      LaboratoryLotDetailPage({ params: { lotId: 'unknown' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('renders lot provenance, operational summary, snapshot, and formula context link', async () => {
    findByIdMock.mockResolvedValue(lot);

    const jsx = await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } });
    render(jsx);

    expect(findByIdMock).toHaveBeenCalledWith('lot-1');
    expect(screen.getByRole('heading', { name: 'CF-001-L001', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Formula provenance')).toBeInTheDocument();
    expect(screen.getByText('CF-001 — v1.0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view formula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1'
    );
    expect(screen.getByText('Operational summary')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Formula snapshot', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Blend the phases.')).toBeInTheDocument();
    expect(screen.getByText('Stable texture.')).toBeInTheDocument();
  });

  it.each(['planned', 'in_progress', 'completed', 'cancelled'] as const)(
    'allows an append-only follow-up submission for a %s lot',
    async (status) => {
      findByIdMock.mockResolvedValue({ ...lot, status });

      const jsx = await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } });
      render(jsx);

      await userEvent.type(screen.getByLabelText('Date'), '2026-05-10');
      await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), 'Color remains stable.');
      await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));

      await waitFor(() => {
        expect(submitLotFollowUpMock).toHaveBeenCalledWith('lot-1', {
          date: '2026-05-10',
          note: 'Color remains stable.',
        });
      });
    }
  );
});

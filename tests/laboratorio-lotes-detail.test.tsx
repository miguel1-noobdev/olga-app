import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LotFollowUpForm from '@/components/laboratorio/lot-follow-up-form';

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}));

const { submitLotFollowUpMock, routerPushMock } = vi.hoisted(() => ({
  submitLotFollowUpMock: vi.fn(),
  routerPushMock: vi.fn(),
}));

const notFoundMock = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ push: routerPushMock }),
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
  status: 'in_production' as const,
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

function findFollowUpForm(node: React.ReactNode): React.ReactElement | null {
  if (!React.isValidElement(node)) return null;
  if (node.type === LotFollowUpForm) return node;

  const children = React.Children.toArray(node.props.children);
  for (const child of children) {
    const match = findFollowUpForm(child);
    if (match) return match;
  }

  return null;
}

describe('/laboratorio/lotes/[lotId] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitLotFollowUpMock.mockResolvedValue({
      success: true,
      redirectTo: '/laboratorio/lotes/lot-1',
    });
  });

  it('returns notFound when the canonical lot does not exist', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(
      LaboratoryLotDetailPage({ params: { lotId: 'unknown' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('renders the desktop lot summary in two columns with read-only identity, status, and formula provenance', async () => {
    findByIdMock.mockResolvedValue(lot);

    const jsx = await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } });
    render(jsx);

    expect(findByIdMock).toHaveBeenCalledWith('lot-1');
    const summary = screen.getByTestId('lot-detail-summary');
    expect(summary).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'gap-8', 'lg:gap-16');
    expect(summary.parentElement).toHaveClass(
      'border-[#B6FF00]',
      'shadow-[0_0_24px_rgba(182,255,0,0.35)]'
    );
    const lotLabel = within(summary).getByText('Número de Lote');
    expect(lotLabel).toHaveClass('text-primary');
    expect(
      within(summary).getByRole('heading', { name: 'CF-001-L001', level: 1 })
    ).toBeInTheDocument();
    expect(within(summary).getByText('En producción')).toBeInTheDocument();
    expect(screen.getByText(/origen de la fórmula/i)).toBeInTheDocument();
    expect(screen.getByText('CF-001 — v1.0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver fórmula/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas/formula-1'
    );
    expect(screen.getByRole('heading', { name: 'Resumen operativo', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /instantánea de la fórmula/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Blend the phases.')).toBeInTheDocument();
    expect(screen.getByText('Stable texture.')).toBeInTheDocument();
  });

  it('passes the bound server action to the follow-up form', async () => {
    findByIdMock.mockResolvedValue(lot);

    const jsx = await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } });
    const followUpForm = findFollowUpForm(jsx) as React.ReactElement<{
      submitFollowUpEntry: typeof submitLotFollowUpMock;
    }>;

    expect(followUpForm).not.toBeNull();

    expect(followUpForm.props.submitFollowUpEntry.name).toMatch(/^bound /);

    await followUpForm.props.submitFollowUpEntry({
      date: '2026-05-10',
      note: 'Color remains stable.',
      requestId: 'follow-up-request-page',
    });

    expect(submitLotFollowUpMock).toHaveBeenCalledWith('lot-1', {
      date: '2026-05-10',
      note: 'Color remains stable.',
      requestId: 'follow-up-request-page',
    });
  });

  it.each(['in_production', 'finalized', 'discarded'] as const)(
    'allows an append-only follow-up submission for a %s lot',
    async (status) => {
      findByIdMock.mockResolvedValue({ ...lot, status });

      const jsx = await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } });
      render(jsx);

      await userEvent.type(screen.getByLabelText(/fecha/i), '2026-05-10');
      await userEvent.type(screen.getByRole('textbox', { name: /nota/i }), 'Color remains stable.');
      await userEvent.click(screen.getByRole('button', { name: /agregar entrada/i }));

      await waitFor(() => {
        expect(submitLotFollowUpMock).toHaveBeenCalledWith('lot-1', expect.objectContaining({
          date: '2026-05-10',
          note: 'Color remains stable.',
          requestId: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
        }));
      });
    }
  );
});

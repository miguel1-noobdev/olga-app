import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LOT_STATUSES } from '@/lib/lots/lot-types';
import { submitNewLot } from '@/app/laboratorio/lotes/nuevo/actions';
import {
  createEmptyLotEditFormValues,
  toUpdateLotInput,
  validateMinimumLotEditForm,
} from '@/lib/lots/lot-edit-form-contract';

const { getCurrentUserMock, findByIdMock, findLotByIdMock, createMock, updateMock, redirectMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  findByIdMock: vi.fn(),
  findLotByIdMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT ${path}`); }),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({ findById: findByIdMock })),
}));
vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({
    create: createMock,
    findById: findLotByIdMock,
    update: updateMock,
  })),
}));

describe('lot operational summary contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  it('creates every new lot in production with an automatic start date', async () => {
    findByIdMock.mockResolvedValue({ id: 'formula-1', status: 'validated' });
    createMock.mockResolvedValue({ id: 'lot-1' });

    await submitNewLot({ formulaId: 'formula-1', targetBatchGrams: 500 });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        formulaId: 'formula-1',
        targetBatchGrams: 500,
        status: 'in_production',
      })
    );
  });

  it('exposes exactly the three canonical operational states', () => {
    expect(LOT_STATUSES).toEqual(['in_production', 'finalized', 'discarded']);
  });

  it('persists a valid completion date and status without editable planning or start dates', () => {
    const values = createEmptyLotEditFormValues();
    values.status = 'finalized';
    values.completedAt = '2026-07-18';

    expect(validateMinimumLotEditForm(values)).toEqual({ valid: true, errors: {} });
    expect(toUpdateLotInput(values)).toEqual({
      status: 'finalized',
      completedAt: new Date('2026-07-18'),
    });
  });

  it('rejects an invalid completion date', () => {
    const values = createEmptyLotEditFormValues();
    values.completedAt = 'not-a-date';

    expect(validateMinimumLotEditForm(values)).toEqual({
      valid: false,
      errors: { completedAt: 'La fecha de finalización no es válida' },
    });
  });

  it('rejects a calendar-invalid completion date', () => {
    const values = createEmptyLotEditFormValues();
    values.completedAt = '2026-02-30';

    expect(validateMinimumLotEditForm(values)).toEqual({
      valid: false,
      errors: { completedAt: 'La fecha de finalización no es válida' },
    });
  });

  it('persists the selected status and completion date through the safe server action', async () => {
    findLotByIdMock.mockResolvedValue({
      id: 'lot-1',
      status: 'in_production',
      targetBatchGrams: 500,
    });
    updateMock.mockResolvedValue({ id: 'lot-1' });

    await expect(
      submitLotEditUpdate('lot-1', {
        ...createEmptyLotEditFormValues(),
        status: 'finalized',
        completedAt: '2026-07-18',
      })
    ).resolves.toEqual({ success: true, redirectTo: '/laboratorio/lotes/lot-1' });

    expect(updateMock).toHaveBeenCalledWith('lot-1', expect.objectContaining({
      status: 'finalized',
      completedAt: new Date('2026-07-18'),
    }));
  });
});

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: redirectMock,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock('@/app/laboratorio/lotes/[lotId]/actions', () => ({ submitLotFollowUp: vi.fn() }));

import LaboratoryLotDetailPage from '@/app/laboratorio/lotes/[lotId]/page';
import { submitLotEditUpdate } from '@/app/laboratorio/lotes/[lotId]/editar/actions';

describe('Resumen operativo presentation', () => {
  it('keeps the target field, removes the planned date, and links to the safe editor', async () => {
    findLotByIdMock.mockResolvedValue({
      id: 'lot-1',
      formulaId: 'formula-1',
      formulaCode: 'CF-001',
      formulaVersion: '1.0',
      lotNumber: 1,
      lotCode: 'CF-001-L001',
      status: 'in_production',
      targetBatchGrams: 500,
      formulaSnapshot: { productName: 'Crema', productType: 'crema', targetBatchGrams: 500, procedureSteps: [] },
      followUp: { entries: [] },
      plannedAt: '2026-07-17T00:00:00.000Z',
      startedAt: '2026-07-18T00:00:00.000Z',
      completedAt: null,
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
    });

    render(await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } }));

    const section = screen.getByTestId('lot-operational-summary');
    expect(section).toHaveClass('border-[#FF0000]', 'shadow-[0_0_24px_rgba(255,0,0,0.35)]');
    expect(screen.getByRole('heading', { name: 'Resumen operativo', level: 2 })).toHaveClass('text-[#FF0000]');
    expect(screen.getByText('Lote objetivo')).toBeInTheDocument();
    expect(screen.queryByText(/planificado el/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /editar resumen operativo/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes/lot-1/editar'
    );
  });

  it.each([
    ['legacy lot without startedAt', null],
    ['new lot with automatic startedAt', '2026-07-19T00:00:00.000Z'],
  ])('displays the persisted creation date for a %s', async (_description, startedAt) => {
    findLotByIdMock.mockResolvedValue({
      id: 'lot-1',
      formulaId: 'formula-1',
      formulaCode: 'CF-001',
      formulaVersion: '1.0',
      lotNumber: 1,
      lotCode: 'CF-001-L001',
      status: 'in_production',
      targetBatchGrams: 500,
      formulaSnapshot: { productName: 'Crema', productType: 'crema', targetBatchGrams: 500, procedureSteps: [] },
      followUp: { entries: [] },
      plannedAt: null,
      startedAt,
      completedAt: null,
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-19T00:00:00.000Z',
    });

    render(await LaboratoryLotDetailPage({ params: { lotId: 'lot-1' } }));

    const section = screen.getByTestId('lot-operational-summary');
    expect(section).toHaveTextContent('Fecha de inicio');
    expect(section).toHaveTextContent('18 jul 2026');
    expect(section).not.toHaveTextContent('19 jul 2026');
  });
});

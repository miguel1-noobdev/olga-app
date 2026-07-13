import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT ${path}`); }),
}));
const { findFormulaByIdMock } = vi.hoisted(() => ({ findFormulaByIdMock: vi.fn() }));
const { findLotByIdMock } = vi.hoisted(() => ({ findLotByIdMock: vi.fn() }));
const notFoundMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: () => { notFoundMock(); throw new Error('NEXT_NOT_FOUND'); },
}));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/formula', () => ({
  createFormulaRepository: vi.fn(() => ({ findById: findFormulaByIdMock })),
}));
vi.mock('@/lib/db/repository/lot', () => ({
  createLotRepository: vi.fn(() => ({ findById: findLotByIdMock })),
}));

import LegacyLotDetailPage from '@/app/laboratorio/formulas/[id]/lotes/[lotId]/page';
import LegacyLotEditPage from '@/app/laboratorio/formulas/[id]/lotes/[lotId]/edit/page';
import LegacyLotCreatePage from '@/app/laboratorio/formulas/[id]/lotes/nuevo/page';

describe('legacy formula-nested lot redirects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects a matching legacy detail URL to its canonical lot URL', async () => {
    findLotByIdMock.mockResolvedValue({ id: 'lot-1', formulaId: 'formula-1' });

    await expect(LegacyLotDetailPage({ params: { id: 'formula-1', lotId: 'lot-1' } })).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/lotes/lot-1'
    );
    expect(findLotByIdMock).toHaveBeenCalledWith('lot-1');
  });

  it('returns notFound for detail and edit URLs whose lot does not belong to the formula context', async () => {
    findLotByIdMock.mockResolvedValue({ id: 'lot-1', formulaId: 'formula-other' });

    await expect(LegacyLotDetailPage({ params: { id: 'formula-1', lotId: 'lot-1' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    await expect(LegacyLotEditPage({ params: { id: 'formula-1', lotId: 'lot-1' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(2);
  });

  it('redirects a matching legacy edit URL to the canonical Spanish edit URL', async () => {
    findLotByIdMock.mockResolvedValue({ id: 'lot-1', formulaId: 'formula-1' });

    await expect(LegacyLotEditPage({ params: { id: 'formula-1', lotId: 'lot-1' } })).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/lotes/lot-1/editar'
    );
  });

  it('redirects legacy creation only when its formula context is validated', async () => {
    findFormulaByIdMock.mockResolvedValue({ id: 'formula-1', status: 'validated' });

    await expect(LegacyLotCreatePage({ params: { id: 'formula-1' } })).rejects.toThrow(
      'NEXT_REDIRECT /laboratorio/lotes/nuevo?formulaId=formula-1'
    );
    expect(findFormulaByIdMock).toHaveBeenCalledWith('formula-1');
  });

  it('returns notFound when legacy creation has unavailable or unvalidated formula context', async () => {
    findFormulaByIdMock.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'formula-1', status: 'draft' });

    await expect(LegacyLotCreatePage({ params: { id: 'missing' } })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(LegacyLotCreatePage({ params: { id: 'formula-1' } })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(2);
  });
});

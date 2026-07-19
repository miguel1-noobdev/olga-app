import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateOilNotes } from '@/app/laboratorio/aceites/[slug]/actions';

const { getCurrentUserMock, connectToDatabaseMock, updateMock, revalidatePathMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(), updateMock: vi.fn(), revalidatePathMock: vi.fn(),
}));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/oil', () => ({ createOilRepository: () => ({ update: updateMock }) }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

describe('updateOilNotes server action', () => {
  beforeEach(() => vi.clearAllMocks());
  beforeEach(() => getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'admin' }));

  it('rejects non-staff calls before database access', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1', role: 'suscriptora' });
    await expect(updateOilNotes('oil-1', 'aceite-de-oliva', { notes: 'Nueva nota' })).resolves.toEqual({ success: false, error: 'No autorizado' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('updates only notes, preserving sibling oil data in the repository, and revalidates its canonical detail', async () => {
    updateMock.mockResolvedValue({ id: 'oil-1' });
    await expect(updateOilNotes('oil-1', 'aceite-de-oliva', { notes: 'Nueva nota' })).resolves.toEqual({ success: true });
    expect(updateMock).toHaveBeenCalledWith('oil-1', { notes: 'Nueva nota' });
    expect(revalidatePathMock).toHaveBeenCalledWith('/laboratorio/aceites/aceite-de-oliva');
  });

  it('returns validation errors without hitting the database and returns serializable repository errors', async () => {
    await expect(updateOilNotes('oil-1', 'aceite-de-oliva', { notes: 'x'.repeat(2001) })).resolves.toEqual({ success: false, errors: { notes: 'Las notas no pueden superar los 2000 caracteres' } });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    updateMock.mockRejectedValue(new Error('Oil not found'));
    await expect(updateOilNotes('oil-1', 'aceite-de-oliva', { notes: 'Nueva nota' })).resolves.toEqual({ success: false, error: 'Oil not found' });
  });
});

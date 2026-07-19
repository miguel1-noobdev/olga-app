import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updatePlantNotes } from '@/app/laboratorio/plantas/[slug]/actions';

const { getCurrentUserMock, connectToDatabaseMock, updateMock, revalidatePathMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  connectToDatabaseMock: vi.fn(),
  updateMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/plantas/full-domain', () => ({
  createFullPlantRepository: () => ({ update: updateMock }),
}));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

describe('updatePlantNotes server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  it('rejects unauthenticated calls before database access', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(updatePlantNotes('plant-1', 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({ success: false, error: 'No autorizado' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('persists only internal.notes through the repository merge boundary and revalidates the canonical detail', async () => {
    updateMock.mockResolvedValue({ id: 'plant-1', slug: 'lavanda' });

    await expect(updatePlantNotes('plant-1', 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({ success: true });

    expect(connectToDatabaseMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith('plant-1', { internal: { notes: 'Nueva nota' } });
    expect(revalidatePathMock).toHaveBeenCalledWith('/laboratorio/plantas/lavanda');
  });

  it('returns serializable validation errors without accessing the database', async () => {
    const result = await updatePlantNotes('plant-1', 'lavanda', { notes: 'x'.repeat(2001) });

    expect(result).toEqual({
      success: false,
      errors: { notes: 'Las notas no pueden superar los 2000 caracteres' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('returns a serializable repository error', async () => {
    updateMock.mockRejectedValue(new Error('Plant not found'));

    await expect(updatePlantNotes('plant-1', 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({
      success: false,
      error: 'Plant not found',
    });
  });
});

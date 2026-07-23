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
  const plantId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: 'staff-1', role: 'productora' });
  });

  it('rejects unauthenticated calls before database access', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(updatePlantNotes(plantId, 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({ success: false, error: 'No autorizado' });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('persists only internal.notes through the repository merge boundary and revalidates the canonical detail', async () => {
    updateMock.mockResolvedValue({ id: plantId, slug: 'lavanda' });

    await expect(updatePlantNotes(plantId, 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({ success: true });

    expect(connectToDatabaseMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith(plantId, { internal: { notes: 'Nueva nota' } });
    expect(revalidatePathMock).toHaveBeenCalledWith('/laboratorio/plantas/lavanda');
  });

  it('returns serializable validation errors without accessing the database', async () => {
    const result = await updatePlantNotes(plantId, 'lavanda', { notes: 'x'.repeat(2001) });

    expect(result).toEqual({
      success: false,
      errors: { notes: 'Las notas no pueden superar los 2000 caracteres' },
    });
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it('returns a serializable repository error', async () => {
    updateMock.mockRejectedValueOnce(new Error('Plant not found'));

    await expect(updatePlantNotes(plantId, 'lavanda', { notes: 'Nueva nota' })).resolves.toEqual({
      success: false,
      error: 'No se pudieron guardar las notas. Inténtelo de nuevo.',
    });
  });

  it('returns a stable error when database connection fails', async () => {
    connectToDatabaseMock.mockRejectedValueOnce(new Error('MongoServerSelectionError mongodb://secret-host/app'));

    const result = await updatePlantNotes(plantId, 'lavanda', { notes: 'Nueva nota' });

    expect(result).toEqual({ success: false, error: 'No se pudieron guardar las notas. Inténtelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('mongodb://secret-host');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns a stable error when authentication lookup fails', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error('CastError: database connection string'));

    const result = await updatePlantNotes(plantId, 'lavanda', { notes: 'Nueva nota' });

    expect(result).toEqual({ success: false, error: 'No se pudieron guardar las notas. Inténtelo de nuevo.' });
    expect(JSON.stringify(result)).not.toContain('connection string');
  });
});

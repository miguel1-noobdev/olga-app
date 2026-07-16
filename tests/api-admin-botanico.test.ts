import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getCurrentUserMock, plantCreateMock, oilUpdateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  plantCreateMock: vi.fn(),
  oilUpdateMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: vi.fn(() => ({ create: plantCreateMock, update: vi.fn() })),
}));
vi.mock('@/lib/db/repository/oil', () => ({
  createOilRepository: vi.fn(() => ({ create: vi.fn(), update: oilUpdateMock })),
}));

import { POST } from '@/app/api/admin/botanico/[catalog]/route';

describe('POST /api/admin/botanico/[catalog]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    plantCreateMock.mockResolvedValue({ id: 'plant-1' });
    oilUpdateMock.mockResolvedValue({ id: 'oil-1' });
  });

  it('rejects a non-Admin before it can create a canonical plant', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'productora' });

    const response = await POST(
      new Request('http://localhost/api/admin/botanico/plants', {
        method: 'POST',
        body: JSON.stringify({ commonName: 'Lavanda', scientificName: 'Lavandula angustifolia', family: 'Lamiaceae' }),
      }),
      { params: { catalog: 'plants' } }
    );

    expect(response.status).toBe(403);
    expect(plantCreateMock).not.toHaveBeenCalled();
  });

  it('stores a valid plant through the canonical plantas repository', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'admin' });

    const response = await POST(
      new Request('http://localhost/api/admin/botanico/plants', {
        method: 'POST',
        body: JSON.stringify({ commonName: 'Lavanda', scientificName: 'Lavandula angustifolia', family: 'Lamiaceae' }),
      }),
      { params: { catalog: 'plants' } }
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 'plant-1' });
    expect(plantCreateMock).toHaveBeenCalledWith({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia',
      family: 'Lamiaceae',
    });
  });

  it('returns validation errors without changing an oil/extract record', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'admin' });

    const response = await POST(
      new Request('http://localhost/api/admin/botanico/oils', {
        method: 'POST',
        body: JSON.stringify({ id: 'oil-1', name: 'Aceite de jojoba', recommendedPercentage: -1 }),
      }),
      { params: { catalog: 'oils' } }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      errors: { recommendedPercentage: 'Recommended percentage must be between 0 and 100.' },
    });
    expect(oilUpdateMock).not.toHaveBeenCalled();
  });
});

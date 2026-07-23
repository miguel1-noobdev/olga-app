import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, getCurrentUserMock, connectMock, plantCreateMock, oilUpdateMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  connectMock: vi.fn(),
  plantCreateMock: vi.fn(),
  oilUpdateMock: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: getServerSessionMock }));
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectMock }));
vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: vi.fn(() => ({ create: plantCreateMock, update: vi.fn() })),
}));
vi.mock('@/lib/db/repository/oil', () => ({
  createOilRepository: vi.fn(() => ({ create: vi.fn(), update: oilUpdateMock })),
}));

import { POST } from '@/app/api/admin/botanico/[catalog]/route';

function requestWithOrigin(url: string, init: RequestInit, origin = 'http://localhost'): Request {
  const request = new Request(url, init);
  const headers = new Headers(init.headers);
  headers.set('Origin', origin);
  Object.defineProperty(request, 'headers', { value: headers });
  return request;
}

describe('POST /api/admin/botanico/[catalog]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost');
    plantCreateMock.mockResolvedValue({ id: 'plant-1' });
    oilUpdateMock.mockResolvedValue({ id: 'oil-1' });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects a non-Admin before it can create a canonical plant', async () => {
    getCurrentUserMock.mockResolvedValue({ role: 'productora' });

    const response = await POST(
      requestWithOrigin('http://localhost/api/admin/botanico/plants', {
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
      requestWithOrigin('http://localhost/api/admin/botanico/plants', {
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
      requestWithOrigin('http://localhost/api/admin/botanico/oils', {
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

  it('rejects a cross-origin mutation before authentication or database work', async () => {
    const response = await POST(
      requestWithOrigin('http://localhost/api/admin/botanico/plants', {
        method: 'POST',
        body: JSON.stringify({ commonName: 'Lavanda' }),
      }, 'https://attacker.example'),
      { params: { catalog: 'plants' } }
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Invalid request origin' });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
    expect(plantCreateMock).not.toHaveBeenCalled();
  });
});

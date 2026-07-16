import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { plantsFindAllMock, oilsFindAllMock } = vi.hoisted(() => ({
  plantsFindAllMock: vi.fn(),
  oilsFindAllMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: vi.fn(() => ({ findAll: plantsFindAllMock })),
}));
vi.mock('@/lib/db/repository/oil', () => ({
  createOilRepository: vi.fn(() => ({ findAll: oilsFindAllMock })),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

import AdminBotanicoPage from '@/app/admin/botanico/page';

describe('/admin/botanico page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows canonical plants and oils/extracts with dedicated create and edit paths', async () => {
    plantsFindAllMock.mockResolvedValue([{
      id: 'plant-1', commonName: 'Lavanda', scientificName: 'Lavandula angustifolia', family: 'Lamiaceae',
    }]);
    oilsFindAllMock.mockResolvedValue([{ id: 'oil-1', name: 'Aceite de jojoba', inciName: 'Simmondsia Chinensis Seed Oil' }]);

    render(await AdminBotanicoPage());

    expect(screen.getByRole('heading', { name: 'Catálogo botánico' })).toBeInTheDocument();
    expect(screen.getByText('Lavanda')).toBeInTheDocument();
    expect(screen.getByText('Aceite de jojoba')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva planta' })).toHaveAttribute('href', '/admin/botanico/plantas/nueva');
    expect(screen.getByRole('link', { name: 'Nuevo aceite o extracto' })).toHaveAttribute('href', '/admin/botanico/aceites-extractos/nuevo');
    expect(screen.getByRole('link', { name: 'Editar Lavanda' })).toHaveAttribute('href', '/admin/botanico/plantas/plant-1/editar');
    expect(screen.getByRole('link', { name: 'Editar Aceite de jojoba' })).toHaveAttribute('href', '/admin/botanico/aceites-extractos/oil-1/editar');
  });
});

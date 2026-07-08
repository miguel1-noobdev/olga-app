import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PublicPlantDetail } from '@/lib/jardin-digital/projection';

const { connectToDatabaseMock, findBySlugMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findBySlugMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: () => ({
    findBySlug: findBySlugMock,
  }),
}));

vi.mock('@/components/jardin-digital/plant-detail', () => ({
  default: ({ plant }: { plant: PublicPlantDetail }) => (
    <article data-testid="plant-detail">{plant.commonName}</article>
  ),
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

import PlantDetailPage from '@/app/jardin-digital/[slug]/page';

const mockPlant: PublicPlantDetail = {
  id: 'plant-1',
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia Mill.',
  family: 'Lamiaceae',
  usedParts: ['Sumidades floridas'],
  compounds: [{ name: 'Linalol', percentage: '20-45%' }],
  properties: {
    oral: ['Ansiolítico'],
    topical: ['Antiinflamatorio'],
  },
  contraindications: ['Hipersensibilidad a la planta'],
  availableExtracts: [{ type: 'Aceite Esencial' }],
  description: 'Planta aromática mediterránea',
  slug: 'lavandula-angustifolia-mill',
  images: [],
};

describe('PlantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the back link with an inline SVG instead of the icon font', async () => {
    findBySlugMock.mockResolvedValueOnce(mockPlant);

    const element = await PlantDetailPage({
      params: { slug: 'lavandula-angustifolia-mill' },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('/jardin-digital');
    expect(html).toContain('Volver al catálogo');
    expect(html).not.toContain('material-symbols-outlined');
  });
});

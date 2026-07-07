import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PlantRecord } from '@/lib/db/repository/plant';

const { connectToDatabaseMock, findAllMock, navbarMock, homepageMock, footerMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findAllMock: vi.fn(),
  navbarMock: vi.fn(() => <div data-testid="jardin-navbar" />),
  homepageMock: vi.fn(({ plants }: { plants: PlantRecord[] }) => (
    <section data-testid="jardin-homepage">
      {plants.map((plant) => (
        <span key={plant.id}>{plant.commonName}</span>
      ))}
    </section>
  )),
  footerMock: vi.fn(() => <div data-testid="jardin-footer" />),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/plant', () => ({
  createPlantRepository: () => ({
    findAll: findAllMock,
  }),
}));

vi.mock('@/components/jardin-digital/jardin-navbar', () => ({
  default: () => <nav data-testid="jardin-navbar">Jardín Digital Navbar</nav>,
}));

vi.mock('@/components/jardin-digital/jardin-homepage', () => ({
  default: homepageMock,
}));

vi.mock('@/components/jardin-digital/jardin-footer', () => ({
  default: footerMock,
}));

import JardinDigitalPage from '@/app/jardin-digital/page';

const mockPlants: PlantRecord[] = [
  {
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
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'plant-2',
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis Miller',
    family: 'Asphodelaceae',
    usedParts: ['Gel'],
    compounds: [{ name: 'Polisacáridos' }],
    properties: {
      oral: [],
      topical: ['Cicatrizante'],
    },
    contraindications: [],
    availableExtracts: [{ type: 'Gel' }],
    description: 'Planta suculenta medicinal',
    slug: 'aloe-barbadensis-miller',
    images: [],
    createdAt: '2026-07-02T10:00:00.000Z',
  },
];

describe('JardinDigitalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('connects to database and loads all plants', async () => {
    findAllMock.mockResolvedValueOnce(mockPlants);

    const element = await JardinDigitalPage();
    const html = renderToStaticMarkup(element);

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findAllMock).toHaveBeenCalledTimes(1);
    expect(homepageMock).toHaveBeenCalledTimes(1);
    expect(homepageMock.mock.calls[0][0].plants).toEqual(mockPlants);
  });

  it('renders navbar, homepage, and footer', async () => {
    findAllMock.mockResolvedValueOnce(mockPlants);

    const element = await JardinDigitalPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('data-testid="jardin-navbar"');
    expect(html).toContain('data-testid="jardin-homepage"');
    expect(html).toContain('data-testid="jardin-footer"');
  });

  it('passes plant data to homepage component', async () => {
    findAllMock.mockResolvedValueOnce(mockPlants);

    const element = await JardinDigitalPage();
    renderToStaticMarkup(element);

    const homepageProps = homepageMock.mock.calls[0][0];
    expect(homepageProps.plants).toHaveLength(2);
    expect(homepageProps.plants[0].commonName).toBe('Lavanda');
    expect(homepageProps.plants[1].commonName).toBe('Aloe Vera');
  });

  it('handles empty plant list gracefully', async () => {
    findAllMock.mockResolvedValueOnce([]);

    const element = await JardinDigitalPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('data-testid="jardin-homepage"');
    expect(homepageMock.mock.calls[0][0].plants).toEqual([]);
  });
});

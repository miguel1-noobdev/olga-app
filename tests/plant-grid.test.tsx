import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PlantGrid from '@/components/jardin-digital/plant-grid';
import type { PublicPlant } from '@/lib/jardin-digital/projection';

vi.mock('@/components/jardin-digital/plant-card', () => ({
  default: ({ plant }: { plant: PublicPlant }) => (
    <div data-testid="plant-card">{plant.commonName}</div>
  ),
}));

const mockPlants: PublicPlant[] = [
  {
    id: 'plant-1',
    commonName: 'Lavanda',
    scientificName: 'Lavandula angustifolia',
    family: 'Lamiaceae',
    usedParts: [],
    compounds: [],
    properties: { oral: [], topical: [] },
    contraindications: [],
    availableExtracts: [],
    slug: 'lavandula-angustifolia',
  },
  {
    id: 'plant-2',
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis',
    family: 'Asphodelaceae',
    usedParts: [],
    compounds: [],
    properties: { oral: [], topical: [] },
    contraindications: [],
    availableExtracts: [],
    slug: 'aloe-barbadensis',
  },
  {
    id: 'plant-3',
    commonName: 'Romero',
    scientificName: 'Salvia rosmarinus',
    family: 'Lamiaceae',
    usedParts: [],
    compounds: [],
    properties: { oral: [], topical: [] },
    contraindications: [],
    availableExtracts: [],
    slug: 'salvia-rosmarinus',
  },
];

describe('PlantGrid', () => {
  it('renders all plants', () => {
    const html = renderToStaticMarkup(<PlantGrid plants={mockPlants} />);
    expect(html).toContain('Lavanda');
    expect(html).toContain('Aloe Vera');
    expect(html).toContain('Romero');
  });

  it('renders correct number of plant cards', () => {
    const html = renderToStaticMarkup(<PlantGrid plants={mockPlants} />);
    const cardCount = (html.match(/data-testid="plant-card"/g) || []).length;
    expect(cardCount).toBe(3);
  });

  it('renders empty state message when no plants', () => {
    const html = renderToStaticMarkup(<PlantGrid plants={[]} />);
    expect(html).toContain('No hay plantas disponibles');
    const cardCount = (html.match(/data-testid="plant-card"/g) || []).length;
    expect(cardCount).toBe(0);
  });

  it('uses responsive grid classes', () => {
    const html = renderToStaticMarkup(<PlantGrid plants={mockPlants} />);
    expect(html).toContain('grid-cols-1');
    expect(html).toContain('sm:grid-cols-2');
    expect(html).toContain('lg:grid-cols-3');
  });
});

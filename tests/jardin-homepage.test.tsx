import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JardinHomepage from '@/components/jardin-digital/jardin-homepage';
import type { PlantRecord } from '@/lib/db/repository/plant';

vi.mock('@/components/jardin-digital/jardin-hero', () => ({
  default: () => <div data-testid="jardin-hero" />,
}));

vi.mock('@/components/jardin-digital/jardin-filters', () => ({
  default: () => <div data-testid="jardin-filters" />,
}));

vi.mock('@/components/jardin-digital/plant-grid', () => ({
  default: ({ plants }: { plants: PlantRecord[] }) => (
    <div data-testid="plant-grid">
      {plants.map((plant) => (
        <span key={plant.id}>{plant.commonName}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/jardin-digital/jardin-compromiso', () => ({
  default: () => <div data-testid="jardin-compromiso" />,
}));

const mockPlants: PlantRecord[] = [
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
    createdAt: '2026-07-01T10:00:00.000Z',
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
    createdAt: '2026-07-02T10:00:00.000Z',
  },
];

describe('JardinHomepage', () => {
  it('renders hero section', () => {
    const html = renderToStaticMarkup(<JardinHomepage plants={mockPlants} />);
    expect(html).toContain('data-testid="jardin-hero"');
  });

  it('renders filters section', () => {
    const html = renderToStaticMarkup(<JardinHomepage plants={mockPlants} />);
    expect(html).toContain('data-testid="jardin-filters"');
  });

  it('renders plant grid with plants', () => {
    const html = renderToStaticMarkup(<JardinHomepage plants={mockPlants} />);
    expect(html).toContain('data-testid="plant-grid"');
    expect(html).toContain('Lavanda');
    expect(html).toContain('Aloe Vera');
  });

  it('renders compromiso section', () => {
    const html = renderToStaticMarkup(<JardinHomepage plants={mockPlants} />);
    expect(html).toContain('data-testid="jardin-compromiso"');
  });

  it('handles empty plant list', () => {
    const html = renderToStaticMarkup(<JardinHomepage plants={[]} />);
    expect(html).toContain('data-testid="plant-grid"');
  });
});

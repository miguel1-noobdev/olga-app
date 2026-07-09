import { describe, it, expect } from 'vitest';
import type { PlantRecord } from '@/lib/db/repository/plant';
import {
  buildJardinDigitalCatalog,
  resolveJardinDigitalPlant,
} from '@/lib/jardin-digital/catalog';

const fullPlant: PlantRecord = {
  id: 'plant-1',
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia Mill.',
  slug: 'lavandula-angustifolia-mill',
  species: 'Lavandula angustifolia',
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
  images: [{ url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' }],
  internal: {
    cultivationNotes: 'Pleno sol, suelo drenado.',
    notes: 'Stock bajo para primavera.',
  },
  createdAt: '2026-07-01T10:00:00.000Z',
};

const secondPlant: PlantRecord = {
  id: 'plant-2',
  commonName: 'Aloe Vera',
  scientificName: 'Aloe barbadensis Miller',
  slug: 'aloe-barbadensis-miller',
  family: 'Asphodelaceae',
  usedParts: ['Gel'],
  compounds: [],
  properties: { oral: [], topical: [] },
  contraindications: [],
  availableExtracts: [{ type: 'Gel' }],
  description: 'Planta suculenta medicinal',
  images: [],
  createdAt: '2026-07-02T10:00:00.000Z',
};

describe('buildJardinDigitalCatalog', () => {
  it('includes every plant from the repository as a public card', () => {
    const catalog = buildJardinDigitalCatalog([fullPlant, secondPlant]);

    expect(catalog).toHaveLength(2);
    expect(catalog[0].commonName).toBe('Lavanda');
    expect(catalog[1].commonName).toBe('Aloe Vera');
  });

  it('excludes internal-only fields from every catalog card', () => {
    const catalog = buildJardinDigitalCatalog([fullPlant]);

    expect(catalog[0]).not.toHaveProperty('internal');
    expect(catalog[0]).not.toHaveProperty('createdAt');
  });

  it('returns an empty catalog when no plants are loaded', () => {
    const catalog = buildJardinDigitalCatalog([]);

    expect(catalog).toEqual([]);
  });
});

describe('resolveJardinDigitalPlant', () => {
  it('returns a public detail for a plant that exists in the repository', () => {
    const publicPlant = resolveJardinDigitalPlant(fullPlant);

    expect(publicPlant).not.toBeNull();
    expect(publicPlant?.commonName).toBe('Lavanda');
    expect(publicPlant?.slug).toBe('lavandula-angustifolia-mill');
  });

  it('excludes internal-only fields from the public detail', () => {
    const publicPlant = resolveJardinDigitalPlant(fullPlant);

    expect(publicPlant).not.toHaveProperty('internal');
    expect(publicPlant).not.toHaveProperty('createdAt');
  });

  it('returns null when the plant is not found in the repository', () => {
    const publicPlant = resolveJardinDigitalPlant(null);

    expect(publicPlant).toBeNull();
  });
});

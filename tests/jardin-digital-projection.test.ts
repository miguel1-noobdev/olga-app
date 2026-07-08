import { describe, it, expect } from 'vitest';
import type { PlantRecord } from '@/lib/db/repository/plant';
import { toPublicPlant, type PublicPlant } from '@/lib/jardin-digital/projection';

const fullPlant: PlantRecord = {
  id: 'plant-1',
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia Mill.',
  slug: 'lavandula-angustifolia-mill',
  species: 'Lavandula angustifolia',
  family: 'Lamiaceae',
  usedParts: ['Sumidades floridas'],
  compounds: [{ name: 'Linalol', percentage: '20-45%', description: 'Alcohol terpénico' }],
  properties: {
    oral: ['Ansiolítico'],
    topical: ['Antiinflamatorio'],
  },
  contraindications: ['Hipersensibilidad a la planta'],
  availableExtracts: [{ type: 'Aceite Esencial', method: 'Destilación por arrastre de vapor' }],
  description: 'Planta aromática mediterránea',
  images: [{ url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' }],
  createdAt: '2026-07-01T10:00:00.000Z',
};

describe('toPublicPlant', () => {
  it('maps every public field from the full PlantRecord', () => {
    const publicPlant = toPublicPlant(fullPlant);

    expect(publicPlant.id).toBe('plant-1');
    expect(publicPlant.commonName).toBe('Lavanda');
    expect(publicPlant.scientificName).toBe('Lavandula angustifolia Mill.');
    expect(publicPlant.slug).toBe('lavandula-angustifolia-mill');
    expect(publicPlant.species).toBe('Lavandula angustifolia');
    expect(publicPlant.family).toBe('Lamiaceae');
    expect(publicPlant.usedParts).toEqual(['Sumidades floridas']);
    expect(publicPlant.compounds).toEqual([
      { name: 'Linalol', percentage: '20-45%', description: 'Alcohol terpénico' },
    ]);
    expect(publicPlant.properties).toEqual({
      oral: ['Ansiolítico'],
      topical: ['Antiinflamatorio'],
    });
    expect(publicPlant.contraindications).toEqual(['Hipersensibilidad a la planta']);
    expect(publicPlant.availableExtracts).toEqual([
      { type: 'Aceite Esencial', method: 'Destilación por arrastre de vapor' },
    ]);
    expect(publicPlant.description).toBe('Planta aromática mediterránea');
    expect(publicPlant.images).toEqual([
      { url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' },
    ]);
  });

  it('excludes internal-only fields such as createdAt', () => {
    const publicPlant = toPublicPlant(fullPlant);

    expect(publicPlant).not.toHaveProperty('createdAt');
  });

  it('maps a minimal PlantRecord without optional fields', () => {
    const minimalPlant: PlantRecord = {
      id: 'plant-2',
      commonName: 'Aloe Vera',
      scientificName: 'Aloe barbadensis Miller',
      slug: 'aloe-barbadensis-miller',
      family: 'Asphodelaceae',
      usedParts: ['Gel'],
      compounds: [],
      properties: { oral: [], topical: [] },
      contraindications: [],
      availableExtracts: [],
      createdAt: '2026-07-02T10:00:00.000Z',
    };

    const publicPlant = toPublicPlant(minimalPlant);

    expect(publicPlant.commonName).toBe('Aloe Vera');
    expect(publicPlant.description).toBeUndefined();
    expect(publicPlant.images).toBeUndefined();
    expect(publicPlant.species).toBeUndefined();
    expect(publicPlant).not.toHaveProperty('createdAt');
  });

  it('produces a deterministic PublicPlant type', () => {
    const publicPlant: PublicPlant = toPublicPlant(fullPlant);

    expect(publicPlant).toEqual({
      id: 'plant-1',
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      slug: 'lavandula-angustifolia-mill',
      species: 'Lavandula angustifolia',
      family: 'Lamiaceae',
      usedParts: ['Sumidades floridas'],
      compounds: [{ name: 'Linalol', percentage: '20-45%', description: 'Alcohol terpénico' }],
      properties: {
        oral: ['Ansiolítico'],
        topical: ['Antiinflamatorio'],
      },
      contraindications: ['Hipersensibilidad a la planta'],
      availableExtracts: [{ type: 'Aceite Esencial', method: 'Destilación por arrastre de vapor' }],
      description: 'Planta aromática mediterránea',
      images: [{ url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' }],
    });
  });
});

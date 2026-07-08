import { describe, it, expect } from 'vitest';
import type { PlantRecord } from '@/lib/db/repository/plant';
import {
  toPublicPlantCard,
  toPublicPlantDetail,
  type PublicPlantCard,
  type PublicPlantDetail,
} from '@/lib/jardin-digital/projection';

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

describe('toPublicPlantDetail', () => {
  it('maps every public field from the full PlantRecord', () => {
    const detail = toPublicPlantDetail(fullPlant);

    expect(detail.id).toBe('plant-1');
    expect(detail.commonName).toBe('Lavanda');
    expect(detail.scientificName).toBe('Lavandula angustifolia Mill.');
    expect(detail.slug).toBe('lavandula-angustifolia-mill');
    expect(detail.species).toBe('Lavandula angustifolia');
    expect(detail.family).toBe('Lamiaceae');
    expect(detail.usedParts).toEqual(['Sumidades floridas']);
    expect(detail.compounds).toEqual([
      { name: 'Linalol', percentage: '20-45%', description: 'Alcohol terpénico' },
    ]);
    expect(detail.properties).toEqual({
      oral: ['Ansiolítico'],
      topical: ['Antiinflamatorio'],
    });
    expect(detail.contraindications).toEqual(['Hipersensibilidad a la planta']);
    expect(detail.availableExtracts).toEqual([
      { type: 'Aceite Esencial', method: 'Destilación por arrastre de vapor' },
    ]);
    expect(detail.description).toBe('Planta aromática mediterránea');
    expect(detail.images).toEqual([
      { url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' },
    ]);
  });

  it('excludes internal-only fields such as createdAt', () => {
    const detail = toPublicPlantDetail(fullPlant);

    expect(detail).not.toHaveProperty('createdAt');
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

    const detail = toPublicPlantDetail(minimalPlant);

    expect(detail.commonName).toBe('Aloe Vera');
    expect(detail.description).toBeUndefined();
    expect(detail.images).toBeUndefined();
    expect(detail.species).toBeUndefined();
    expect(detail).not.toHaveProperty('createdAt');
  });

  it('produces a deterministic PublicPlantDetail type', () => {
    const detail: PublicPlantDetail = toPublicPlantDetail(fullPlant);

    expect(detail).toEqual({
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

describe('toPublicPlantCard', () => {
  it('maps only the fields needed by the card view', () => {
    const card = toPublicPlantCard(fullPlant);

    expect(card.id).toBe('plant-1');
    expect(card.commonName).toBe('Lavanda');
    expect(card.scientificName).toBe('Lavandula angustifolia Mill.');
    expect(card.slug).toBe('lavandula-angustifolia-mill');
    expect(card.family).toBe('Lamiaceae');
    expect(card.description).toBe('Planta aromática mediterránea');
    expect(card.images).toEqual([
      { url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' },
    ]);
  });

  it('excludes detail-only fields from the card view', () => {
    const card = toPublicPlantCard(fullPlant);

    expect(card).not.toHaveProperty('species');
    expect(card).not.toHaveProperty('usedParts');
    expect(card).not.toHaveProperty('compounds');
    expect(card).not.toHaveProperty('properties');
    expect(card).not.toHaveProperty('contraindications');
    expect(card).not.toHaveProperty('availableExtracts');
    expect(card).not.toHaveProperty('createdAt');
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

    const card = toPublicPlantCard(minimalPlant);

    expect(card.commonName).toBe('Aloe Vera');
    expect(card.description).toBeUndefined();
    expect(card.images).toBeUndefined();
  });

  it('produces a deterministic PublicPlantCard type', () => {
    const card: PublicPlantCard = toPublicPlantCard(fullPlant);

    expect(card).toEqual({
      id: 'plant-1',
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      slug: 'lavandula-angustifolia-mill',
      family: 'Lamiaceae',
      description: 'Planta aromática mediterránea',
      images: [{ url: 'https://example.com/lavanda.jpg', alt: 'Flores de lavanda' }],
    });
  });
});

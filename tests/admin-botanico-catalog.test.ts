import { describe, expect, it, vi } from 'vitest';
import {
  saveOilCatalogEntry,
  savePlantCatalogEntry,
  type BotanicalCatalogDependencies,
} from '@/lib/admin/botanico/catalog';

function dependencies(): BotanicalCatalogDependencies {
  return {
    plants: {
      create: vi.fn().mockResolvedValue({ id: 'plant-1' }),
      update: vi.fn().mockResolvedValue({ id: 'plant-1' }),
    },
    oils: {
      create: vi.fn().mockResolvedValue({ id: 'oil-1' }),
      update: vi.fn().mockResolvedValue({ id: 'oil-1' }),
    },
  };
}

describe('botanical catalog saves', () => {
  it('stores a valid plant in the canonical plantas repository', async () => {
    const repos = dependencies();

    const result = await savePlantCatalogEntry(repos, {
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia',
      family: 'Lamiaceae',
      usedParts: ['Flores'],
      properties: { oral: ['Relajante'], topical: ['Calmante'] },
      internal: { sourcingNotes: 'Proveedor local' },
    });

    expect(result).toEqual({ success: true, id: 'plant-1' });
    expect(repos.plants.create).toHaveBeenCalledWith({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia',
      family: 'Lamiaceae',
      usedParts: ['Flores'],
      properties: { oral: ['Relajante'], topical: ['Calmante'] },
      internal: { sourcingNotes: 'Proveedor local' },
    });
  });

  it('rejects an invalid plant without changing the canonical repository', async () => {
    const repos = dependencies();

    const result = await savePlantCatalogEntry(repos, {
      commonName: ' ',
      scientificName: '',
      family: '',
    });

    expect(result).toEqual({
      success: false,
      errors: {
        commonName: 'Common name is required.',
        scientificName: 'Scientific name is required.',
        family: 'Family is required.',
      },
    });
    expect(repos.plants.create).not.toHaveBeenCalled();
    expect(repos.plants.update).not.toHaveBeenCalled();
  });

  it('updates an existing valid oil/extract entry instead of creating a duplicate', async () => {
    const repos = dependencies();

    const result = await saveOilCatalogEntry(repos, {
      id: 'oil-1',
      name: 'Aceite de jojoba',
      inciName: 'Simmondsia Chinensis Seed Oil',
      recommendedPercentage: 8,
      solubility: 'Liposoluble',
      skinTypes: ['Seca'],
      absorption: 'Media',
      properties: ['Emoliente'],
      images: [{ url: 'https://example.test/jojoba.jpg', alt: 'Aceite de jojoba' }],
      notes: 'Proveedor verificado.',
    });

    expect(result).toEqual({ success: true, id: 'oil-1' });
    expect(repos.oils.update).toHaveBeenCalledWith('oil-1', {
      name: 'Aceite de jojoba',
      inciName: 'Simmondsia Chinensis Seed Oil',
      recommendedPercentage: 8,
      solubility: 'Liposoluble',
      skinTypes: ['Seca'],
      absorption: 'Media',
      properties: ['Emoliente'],
      images: [{ url: 'https://example.test/jojoba.jpg', alt: 'Aceite de jojoba' }],
      notes: 'Proveedor verificado.',
    });
    expect(repos.oils.create).not.toHaveBeenCalled();
  });

  it('rejects an oil/extract percentage outside the approved range without changing records', async () => {
    const repos = dependencies();

    const result = await saveOilCatalogEntry(repos, {
      name: 'Aceite de jojoba',
      recommendedPercentage: 120,
    });

    expect(result).toEqual({
      success: false,
      errors: { recommendedPercentage: 'Recommended percentage must be between 0 and 100.' },
    });
    expect(repos.oils.create).not.toHaveBeenCalled();
  });
});

import { describe, it, expect } from 'vitest';
import { PLANT_SEEDS } from '../scripts/seed-plants.data';

describe('PLANT_SEEDS', () => {
  function findPlant(commonName: string) {
    const plant = PLANT_SEEDS.find((seed) => seed.commonName === commonName);
    if (!plant) {
      throw new Error(`Plant "${commonName}" not found in PLANT_SEEDS`);
    }
    return plant;
  }

  function expectValidWikimediaImages(commonName: string) {
    const plant = findPlant(commonName);

    expect(plant.images, `${commonName} should define an images array`).toBeDefined();
    expect(plant.images!.length, `${commonName} should have at least one image`).toBeGreaterThan(0);

    for (const image of plant.images!) {
      expect(image.url, `${commonName} image URL must be defined`).toBeDefined();
      expect(image.url.trim().length, `${commonName} image URL must not be empty`).toBeGreaterThan(0);
      expect(image.url, `${commonName} image URL must use HTTPS`).toMatch(/^https:\/\//);
      expect(image.url, `${commonName} image URL must be from Wikimedia Commons`).toContain('upload.wikimedia.org');

      expect(image.alt, `${commonName} image alt text must be defined`).toBeDefined();
      expect(image.alt.trim().length, `${commonName} image alt text must not be empty`).toBeGreaterThan(0);
    }
  }

  it('includes valid Wikimedia Commons images for Lavanda', () => {
    expectValidWikimediaImages('Lavanda');
  });

  it('includes valid Wikimedia Commons images for Rosa Mosqueta', () => {
    expectValidWikimediaImages('Rosa Mosqueta');
  });

  it('includes valid Wikimedia Commons images for Aloe Vera', () => {
    expectValidWikimediaImages('Aloe Vera');
  });

  it('preserves compound descriptions in seed data', () => {
    const ortiga = PLANT_SEEDS.find((seed) => seed.commonName === 'Ortiga');
    expect(ortiga).toBeDefined();

    const phenolicAcids = ortiga!.compounds.find((c) => c.name === 'Ácidos fenólicos');
    expect(phenolicAcids).toBeDefined();
    expect(phenolicAcids!.description).toBe('hojas: ácido clorogénico, cafeico');
  });

  it('allows compounds without description in seed data', () => {
    const lavanda = PLANT_SEEDS.find((seed) => seed.commonName === 'Lavanda');
    expect(lavanda).toBeDefined();

    const linalool = lavanda!.compounds.find((c) => c.name === 'Linalol');
    expect(linalool).toBeDefined();
    expect(linalool!.description).toBeUndefined();
  });
});

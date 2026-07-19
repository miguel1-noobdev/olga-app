import { describe, expect, it, vi } from 'vitest';
import { OLIVE_OIL_SEED } from '../scripts/seed-oils.data';
import { upsertOilSeed } from '../scripts/seed-oils';

describe('olive oil seed', () => {
  it('defines the canonical olive record with the two verified Wikimedia images', () => {
    expect(OLIVE_OIL_SEED).toEqual({
      slug: 'aceite-de-oliva',
      name: 'Aceite de oliva',
      hlb: 7,
      solubility: 'Liposoluble',
      skinTypes: ['Madura', 'Seca'],
      absorption: 'Lenta',
      properties: ['Regenerador'],
      phase: 'Oleosa',
      observations: 'Combina bien',
      recommendedPercentage: null,
      images: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Korfu_%28GR%29%2C_Agii_Douli%2C_Olivenhain_--_2018_--_1284-8.jpg',
          alt: 'Olivar de Olea europaea cerca de Agii Douli, Corfú, Grecia',
        },
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Aceite_de_oliva.png',
          alt: 'Aceite de oliva producido en el valle del Limarí, Chile',
        },
      ],
    });
  });

  it('upserts by stable slug so repeated runs preserve one canonical record', async () => {
    const findOneAndUpdate = vi.fn().mockResolvedValue({ _id: 'olive-id', slug: OLIVE_OIL_SEED.slug });
    const model = { findOneAndUpdate };

    await upsertOilSeed(model, OLIVE_OIL_SEED);
    await upsertOilSeed(model, OLIVE_OIL_SEED);

    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { slug: 'aceite-de-oliva' },
      { $set: OLIVE_OIL_SEED },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
  });
});

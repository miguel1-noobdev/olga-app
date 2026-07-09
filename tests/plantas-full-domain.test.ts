import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PlantModel } from '@/lib/db/models/plant';
import {
  createFullPlantRepository,
  type FullPlant,
} from '@/lib/plantas/full-domain';
import { toPublicPlantDetail } from '@/lib/jardin-digital/projection';

describe('plantas full-domain access layer', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createFullPlantRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await PlantModel.syncIndexes();
    repo = createFullPlantRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function lavenderInput() {
    return {
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
      usedParts: ['Sumidades floridas'],
      compounds: [{ name: 'Linalool' }],
      properties: { oral: ['Ansiolítico'], topical: ['Cicatrizante'] },
      contraindications: ['Hipersensibilidad'],
      availableExtracts: [{ type: 'Aceite Esencial' }],
      internal: {
        cultivationNotes: 'Pleno sol, suelo drenado.',
        harvestNotes: 'Cosechar en floración plena.',
        sourcingNotes: 'Proveedor local orgánico.',
        preparationNotes: 'Secado a la sombra.',
        notes: 'Stock bajo para primavera.',
      },
    };
  }

  it('returns full-domain records including the internal Olga-facing group', async () => {
    const created = await repo.create(lavenderInput());
    const found = await repo.findBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found?.internal?.cultivationNotes).toBe('Pleno sol, suelo drenado.');
    expect(found?.internal?.harvestNotes).toBe('Cosechar en floración plena.');
    expect(found?.internal?.sourcingNotes).toBe('Proveedor local orgánico.');
    expect(found?.internal?.preparationNotes).toBe('Secado a la sombra.');
    expect(found?.internal?.notes).toBe('Stock bajo para primavera.');
  });

  it('exposes the same API as the generic plant repository', async () => {
    const created = await repo.create(lavenderInput());
    const all = await repo.findAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('keeps full-domain data out of the public projection', async () => {
    const full: FullPlant = await repo.create(lavenderInput());
    const publicDetail = toPublicPlantDetail(full);

    expect(publicDetail).not.toHaveProperty('internal');
    expect(publicDetail).not.toHaveProperty('createdAt');
    expect(full.internal?.notes).toBe('Stock bajo para primavera.');
  });
});

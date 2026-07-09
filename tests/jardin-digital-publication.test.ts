import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { PlantModel } from '@/lib/db/models/plant';
import {
  buildJardinDigitalCatalog,
  resolveJardinDigitalPlant,
} from '@/lib/jardin-digital/catalog';

describe('Jardín Digital automatic publication flow', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createPlantRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await PlantModel.syncIndexes();
    repo = createPlantRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('makes a newly created plant available in the public catalog', async () => {
    const created = await repo.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
      description: 'Planta aromática mediterránea',
    });

    const allPlants = await repo.findAll();
    const catalog = buildJardinDigitalCatalog(allPlants);

    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toBe(created.id);
    expect(catalog[0].commonName).toBe('Lavanda');
    expect(catalog[0].slug).toBe('lavandula-angustifolia-mill');
  });

  it('makes a newly created plant reachable as a public detail by slug', async () => {
    await repo.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    const plant = await repo.findBySlug('lavandula-angustifolia-mill');
    const publicPlant = resolveJardinDigitalPlant(plant);

    expect(publicPlant).not.toBeNull();
    expect(publicPlant?.commonName).toBe('Lavanda');
    expect(publicPlant?.slug).toBe('lavandula-angustifolia-mill');
  });

  it('keeps internal fields out of the automatically published catalog', async () => {
    await repo.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
      internal: {
        notes: 'Stock bajo para primavera.',
      },
    });

    const allPlants = await repo.findAll();
    const catalog = buildJardinDigitalCatalog(allPlants);

    expect(catalog[0]).not.toHaveProperty('internal');
  });

  it('keeps internal fields out of the automatically published detail', async () => {
    await repo.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
      internal: {
        notes: 'Stock bajo para primavera.',
      },
    });

    const plant = await repo.findBySlug('lavandula-angustifolia-mill');
    const publicPlant = resolveJardinDigitalPlant(plant);

    expect(publicPlant).not.toHaveProperty('internal');
  });

  it('updates the public catalog automatically when a new plant is added', async () => {
    await repo.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    const firstCatalog = buildJardinDigitalCatalog(await repo.findAll());
    expect(firstCatalog).toHaveLength(1);

    await repo.create({
      commonName: 'Aloe Vera',
      scientificName: 'Aloe barbadensis Miller',
      family: 'Asphodelaceae',
    });

    const secondCatalog = buildJardinDigitalCatalog(await repo.findAll());
    expect(secondCatalog).toHaveLength(2);
    expect(secondCatalog.map((p) => p.commonName)).toContain('Aloe Vera');
  });
});

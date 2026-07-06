import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PlantModel } from '@/lib/db/models/plant';

describe('PlantModel', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await PlantModel.syncIndexes();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('auto-generates slug from scientificName', async () => {
    const plant = await PlantModel.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    expect(plant.slug).toBe('lavandula-angustifolia-mill');
  });

  it('rejects when required fields are missing', async () => {
    await expect(PlantModel.create({})).rejects.toThrow();
  });

  it('rejects duplicate slug', async () => {
    await PlantModel.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    await expect(
      PlantModel.create({
        commonName: 'Lavender',
        scientificName: 'Lavandula angustifolia Mill.',
        family: 'Lamiaceae',
      })
    ).rejects.toThrow();
  });

  it('defines only one slug index', () => {
    const slugIndexes = PlantModel.schema
      .indexes()
      .filter(([fields]) => JSON.stringify(fields) === JSON.stringify({ slug: 1 }));

    expect(slugIndexes).toHaveLength(1);
  });

  it('initializes array fields to empty arrays by default', async () => {
    const plant = await PlantModel.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    expect(plant.usedParts).toEqual([]);
    expect(plant.compounds).toEqual([]);
    expect(plant.contraindications).toEqual([]);
    expect(plant.availableExtracts).toEqual([]);
    expect(plant.properties.oral).toEqual([]);
    expect(plant.properties.topical).toEqual([]);
  });
});

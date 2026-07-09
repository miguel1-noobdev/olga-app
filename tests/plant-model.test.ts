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

  it('preserves compound descriptions', async () => {
    const plant = await PlantModel.create({
      commonName: 'Ortiga',
      scientificName: 'Urtica dioica L.',
      family: 'Urticaceae',
      compounds: [
        { name: 'Flavonoides', description: 'hojas: quercetina, rutina' },
        { name: 'Minerales' },
      ],
    });

    expect(plant.compounds).toHaveLength(2);
    expect(plant.compounds[0].description).toBe('hojas: quercetina, rutina');
    expect(plant.compounds[1].description).toBeUndefined();
  });

  it('initializes internal group as an empty object by default', async () => {
    const plant = await PlantModel.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
    });

    expect(plant.internal).toBeDefined();
    expect(plant.internal?.cultivationNotes).toBeUndefined();
    expect(plant.internal?.harvestNotes).toBeUndefined();
    expect(plant.internal?.sourcingNotes).toBeUndefined();
    expect(plant.internal?.preparationNotes).toBeUndefined();
    expect(plant.internal?.notes).toBeUndefined();
  });

  it('persists internal fields when provided', async () => {
    const plant = await PlantModel.create({
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      family: 'Lamiaceae',
      internal: {
        cultivationNotes: 'Pleno sol, suelo drenado.',
        harvestNotes: 'Cosechar en floración plena.',
        sourcingNotes: 'Proveedor local orgánico.',
        preparationNotes: 'Secado a la sombra.',
        notes: 'Stock bajo para primavera.',
      },
    });

    expect(plant.internal?.cultivationNotes).toBe('Pleno sol, suelo drenado.');
    expect(plant.internal?.harvestNotes).toBe('Cosechar en floración plena.');
    expect(plant.internal?.sourcingNotes).toBe('Proveedor local orgánico.');
    expect(plant.internal?.preparationNotes).toBe('Secado a la sombra.');
    expect(plant.internal?.notes).toBe('Stock bajo para primavera.');
  });
});

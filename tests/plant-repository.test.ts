import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { PlantModel } from '@/lib/db/models/plant';

describe('PlantRepository', () => {
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

  function lavenderInput() {
    return {
      commonName: 'Lavanda',
      scientificName: 'Lavandula angustifolia Mill.',
      species: 'Lavandula angustifolia',
      family: 'Lamiaceae',
      usedParts: ['Flores', 'Sumidades floridas'],
      compounds: [
        { name: 'Linalool', percentage: '25-38%' },
        { name: 'Acetato de linalilo', description: '_componente mayoritario_' },
      ],
      properties: {
        oral: ['Ansiolítico'],
        topical: ['Cicatrizante'],
      },
      contraindications: ['Hipersensibilidad'],
      availableExtracts: [{ type: 'Aceite Esencial' }],
      description: 'Planta aromática',
      internal: {
        cultivationNotes: 'Pleno sol, suelo drenado.',
        harvestNotes: 'Cosechar en floración plena.',
        sourcingNotes: 'Proveedor local orgánico.',
        preparationNotes: 'Secado a la sombra.',
        notes: 'Stock bajo para primavera.',
      },
    };
  }

  describe('create', () => {
    it('creates a plant with an id and iso dates', async () => {
      const plant = await repo.create(lavenderInput());

      expect(plant.id).toBeDefined();
      expect(plant.commonName).toBe('Lavanda');
      expect(plant.slug).toBe('lavandula-angustifolia-mill');
      expect(typeof plant.createdAt).toBe('string');
    });

    it('preserves compound descriptions', async () => {
      const plant = await repo.create(lavenderInput());

      expect(plant.compounds).toHaveLength(2);
      expect(plant.compounds[0].name).toBe('Linalool');
      expect(plant.compounds[0].percentage).toBe('25-38%');
      expect(plant.compounds[1].name).toBe('Acetato de linalilo');
      expect(plant.compounds[1].description).toBe('_componente mayoritario_');
    });

    it('preserves internal fields', async () => {
      const plant = await repo.create(lavenderInput());

      expect(plant.internal?.cultivationNotes).toBe('Pleno sol, suelo drenado.');
      expect(plant.internal?.harvestNotes).toBe('Cosechar en floración plena.');
      expect(plant.internal?.sourcingNotes).toBe('Proveedor local orgánico.');
      expect(plant.internal?.preparationNotes).toBe('Secado a la sombra.');
      expect(plant.internal?.notes).toBe('Stock bajo para primavera.');
    });

    it('creates a plant without internal fields', async () => {
      const plant = await repo.create({
        commonName: 'Manzanilla',
        scientificName: 'Matricaria chamomilla L.',
        family: 'Asteraceae',
      });

      expect(plant.commonName).toBe('Manzanilla');
      expect(plant.internal).toBeDefined();
    });

    it('rejects duplicate slug', async () => {
      await repo.create(lavenderInput());
      await expect(repo.create(lavenderInput())).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('returns the plant when found', async () => {
      const created = await repo.create(lavenderInput());
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.commonName).toBe('Lavanda');
    });

    it('returns internal fields when found', async () => {
      const created = await repo.create(lavenderInput());
      const found = await repo.findById(created.id);
      expect(found?.internal?.notes).toBe('Stock bajo para primavera.');
    });

    it('returns null when not found', async () => {
      const found = await repo.findById('000000000000000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('returns the plant when found', async () => {
      await repo.create(lavenderInput());
      const found = await repo.findBySlug('lavandula-angustifolia-mill');
      expect(found).not.toBeNull();
      expect(found?.commonName).toBe('Lavanda');
    });

    it('is case-insensitive and trims whitespace', async () => {
      await repo.create(lavenderInput());
      const found = await repo.findBySlug('  Lavandula-Angustifolia-Mill  ');
      expect(found).not.toBeNull();
    });

    it('returns null when not found', async () => {
      const found = await repo.findBySlug('unknown');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all plants sorted by commonName', async () => {
      await repo.create(lavenderInput());
      await repo.create({
        commonName: 'Manzanilla',
        scientificName: 'Matricaria chamomilla L.',
        family: 'Asteraceae',
      });

      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      expect(all[0].commonName).toBe('Lavanda');
      expect(all[1].commonName).toBe('Manzanilla');
    });

    it('returns empty array when no plants exist', async () => {
      const all = await repo.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('findByFamily', () => {
    it('returns plants matching the family', async () => {
      await repo.create(lavenderInput());
      await repo.create({
        commonName: 'Manzanilla',
        scientificName: 'Matricaria chamomilla L.',
        family: 'Asteraceae',
      });

      const result = await repo.findByFamily('Lamiaceae');
      expect(result).toHaveLength(1);
      expect(result[0].commonName).toBe('Lavanda');
    });

    it('returns empty array when family has no plants', async () => {
      await repo.create(lavenderInput());
      const result = await repo.findByFamily('Rosaceae');
      expect(result).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('finds by commonName case-insensitively', async () => {
      await repo.create(lavenderInput());
      const result = await repo.searchByName('LAVANDA');
      expect(result).toHaveLength(1);
      expect(result[0].commonName).toBe('Lavanda');
    });

    it('finds by scientificName case-insensitively', async () => {
      await repo.create(lavenderInput());
      const result = await repo.searchByName('ANGUSTIFOLIA');
      expect(result).toHaveLength(1);
    });

    it('returns empty array when nothing matches', async () => {
      await repo.create(lavenderInput());
      const result = await repo.searchByName('tomate');
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates fields and regenerates slug when scientificName changes', async () => {
      const created = await repo.create(lavenderInput());
      const updated = await repo.update(created.id, {
        scientificName: 'Lavandula officinalis Chaix',
        commonName: 'Lavanda fina',
      });

      expect(updated.scientificName).toBe('Lavandula officinalis Chaix');
      expect(updated.commonName).toBe('Lavanda fina');
      expect(updated.slug).toBe('lavandula-officinalis-chaix');
    });

    it('keeps existing slug when scientificName does not change', async () => {
      const created = await repo.create(lavenderInput());
      const updated = await repo.update(created.id, { commonName: 'Lavanda fina' });
      expect(updated.slug).toBe('lavandula-angustifolia-mill');
    });

    it('updates internal fields', async () => {
      const created = await repo.create(lavenderInput());
      const updated = await repo.update(created.id, {
        internal: { notes: 'Stock renovado.' },
      });
      expect(updated.internal?.notes).toBe('Stock renovado.');
    });

    it('preserves existing internal sibling fields during partial internal updates', async () => {
      const created = await repo.create(lavenderInput());
      const updated = await repo.update(created.id, {
        internal: { notes: 'Stock renovado.' },
      });

      expect(updated.internal?.notes).toBe('Stock renovado.');
      expect(updated.internal?.cultivationNotes).toBe('Pleno sol, suelo drenado.');
      expect(updated.internal?.harvestNotes).toBe('Cosechar en floración plena.');
      expect(updated.internal?.sourcingNotes).toBe('Proveedor local orgánico.');
      expect(updated.internal?.preparationNotes).toBe('Secado a la sombra.');
    });

    it('throws when plant is not found', async () => {
      await expect(
        repo.update('000000000000000000000000', { commonName: 'X' })
      ).rejects.toThrow(/not found/);
    });
  });

  describe('delete', () => {
    it('removes the plant', async () => {
      const created = await repo.create(lavenderInput());
      await repo.delete(created.id);
      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it('throws when plant is not found', async () => {
      await expect(repo.delete('000000000000000000000000')).rejects.toThrow(/not found/);
    });
  });
});

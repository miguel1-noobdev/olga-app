import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createOilRepository } from '@/lib/db/repository/oil';
import { OilModel } from '@/lib/db/models/oil';

describe('OilRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createOilRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await OilModel.syncIndexes();
    repo = createOilRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function sweetAlmondInput() {
    return {
      name: 'Aceite de almendras dulces',
      inciName: 'Prunus Amygdalus Dulcis Oil',
      hlb: 6.5,
      phase: 'oil',
      recommendedPercentage: 10,
      observations: 'Emoliente suave.',
      notes: 'Comprar orgánico.',
    };
  }

  describe('create', () => {
    it('creates an oil with an id and iso dates', async () => {
      const oil = await repo.create(sweetAlmondInput());

      expect(oil.id).toBeDefined();
      expect(oil.name).toBe('Aceite de almendras dulces');
      expect(oil.inciName).toBe('Prunus Amygdalus Dulcis Oil');
      expect(oil.hlb).toBe(6.5);
      expect(oil.phase).toBe('oil');
      expect(oil.recommendedPercentage).toBe(10);
      expect(typeof oil.createdAt).toBe('string');
      expect(typeof oil.updatedAt).toBe('string');
    });

    it('creates an oil with only required fields', async () => {
      const oil = await repo.create({ name: 'Aceite de jojoba' });

      expect(oil.name).toBe('Aceite de jojoba');
      expect(oil.recommendedPercentage).toBeNull();
    });

    it('rejects duplicate name', async () => {
      await repo.create(sweetAlmondInput());

      await expect(repo.create(sweetAlmondInput())).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('returns the oil when found', async () => {
      const created = await repo.create(sweetAlmondInput());
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Aceite de almendras dulces');
    });

    it('returns null when not found', async () => {
      const found = await repo.findById('000000000000000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns the oil by name', async () => {
      await repo.create(sweetAlmondInput());
      const found = await repo.findByName('Aceite de almendras dulces');

      expect(found).not.toBeNull();
      expect(found?.inciName).toBe('Prunus Amygdalus Dulcis Oil');
    });

    it('is case-insensitive and trims whitespace', async () => {
      await repo.create(sweetAlmondInput());
      const found = await repo.findByName('  aceite DE almendras dulces  ');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Aceite de almendras dulces');
    });

    it('returns null when no oil matches', async () => {
      const found = await repo.findByName('Aceite inexistente');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all oils sorted by name', async () => {
      await repo.create(sweetAlmondInput());
      await repo.create({ name: 'Aceite de caléndula' });

      const all = await repo.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].name).toBe('Aceite de almendras dulces');
      expect(all[1].name).toBe('Aceite de caléndula');
    });

    it('returns empty array when no oils exist', async () => {
      const all = await repo.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('finds oils by name case-insensitively', async () => {
      await repo.create(sweetAlmondInput());

      const result = await repo.searchByName('almendras');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aceite de almendras dulces');
    });

    it('finds oils by inciName case-insensitively', async () => {
      await repo.create(sweetAlmondInput());

      const result = await repo.searchByName('prunus amygdalus');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aceite de almendras dulces');
    });

    it('returns empty array when nothing matches', async () => {
      await repo.create(sweetAlmondInput());

      const result = await repo.searchByName('jojoba');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates top-level fields', async () => {
      const created = await repo.create(sweetAlmondInput());
      const updated = await repo.update(created.id, {
        name: 'Aceite de almendras dulces refinado',
        hlb: 7,
        recommendedPercentage: 15,
      });

      expect(updated.name).toBe('Aceite de almendras dulces refinado');
      expect(updated.hlb).toBe(7);
      expect(updated.recommendedPercentage).toBe(15);
      expect(updated.inciName).toBe('Prunus Amygdalus Dulcis Oil');
    });

    it('sets recommendedPercentage to null', async () => {
      const created = await repo.create(sweetAlmondInput());
      const updated = await repo.update(created.id, {
        recommendedPercentage: null,
      });

      expect(updated.recommendedPercentage).toBeNull();
    });

    it('throws when oil is not found', async () => {
      await expect(
        repo.update('000000000000000000000000', { name: 'X' })
      ).rejects.toThrow(/not found/);
    });

    it('rejects duplicate name on update', async () => {
      const created = await repo.create(sweetAlmondInput());
      await repo.create({ name: 'Aceite de jojoba' });

      await expect(
        repo.update(created.id, { name: 'Aceite de jojoba' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes the oil', async () => {
      const created = await repo.create(sweetAlmondInput());
      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it('throws when oil is not found', async () => {
      await expect(repo.delete('000000000000000000000000')).rejects.toThrow(/not found/);
    });
  });
});

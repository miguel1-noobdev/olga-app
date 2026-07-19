import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { OilModel } from '@/lib/db/models/oil';

describe('OilModel', () => {
  let mongoServer: MongoMemoryServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await OilModel.syncIndexes();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function validOilInput() {
    return {
      name: 'Aceite de almendras dulces',
      inciName: 'Prunus Amygdalus Dulcis Oil',
      hlb: 6.5,
      phase: 'oil',
      recommendedPercentage: 10,
      observations: 'Emoliente suave, ideal para pieles sensibles.',
      notes: 'Comprar versión orgánica cuando sea posible.',
      solubility: 'Liposoluble',
      skinTypes: ['Seca', 'Sensible'],
      absorption: 'Media',
      properties: ['Emoliente', 'Protector'],
      images: [{ url: 'https://example.test/almendras.jpg', alt: 'Aceite de almendras' }],
    };
  }

  it('persists a complete oil with all fields', async () => {
    const oil = await OilModel.create(validOilInput());

    expect(oil.name).toBe('Aceite de almendras dulces');
    expect(oil.inciName).toBe('Prunus Amygdalus Dulcis Oil');
    expect(oil.hlb).toBe(6.5);
    expect(oil.phase).toBe('oil');
    expect(oil.recommendedPercentage).toBe(10);
    expect(oil.observations).toBe('Emoliente suave, ideal para pieles sensibles.');
    expect(oil.notes).toBe('Comprar versión orgánica cuando sea posible.');
    expect(oil.slug).toBe('aceite-de-almendras-dulces');
    expect(oil.solubility).toBe('Liposoluble');
    expect(oil.skinTypes).toEqual(['Seca', 'Sensible']);
    expect(oil.absorption).toBe('Media');
    expect(oil.properties).toEqual(['Emoliente', 'Protector']);
    expect(JSON.parse(JSON.stringify(oil.images))).toEqual([{ url: 'https://example.test/almendras.jpg', alt: 'Aceite de almendras' }]);
  });

  it('persists an oil with only required fields', async () => {
    const oil = await OilModel.create({ name: 'Aceite de jojoba' });

    expect(oil.name).toBe('Aceite de jojoba');
    expect(oil.inciName).toBeUndefined();
    expect(oil.hlb).toBeUndefined();
    expect(oil.phase).toBeUndefined();
    expect(oil.recommendedPercentage).toBeNull();
    expect(oil.observations).toBeUndefined();
    expect(oil.notes).toBeUndefined();
    expect(oil.slug).toBe('aceite-de-jojoba');
    expect(oil.skinTypes).toEqual([]);
    expect(oil.properties).toEqual([]);
    expect(oil.images).toEqual([]);
  });

  it('accepts null recommendedPercentage', async () => {
    const oil = await OilModel.create({
      name: 'Aceite de coco fraccionado',
      recommendedPercentage: null,
    });

    expect(oil.recommendedPercentage).toBeNull();
  });

  it('rejects when name is missing', async () => {
    await expect(OilModel.create({})).rejects.toThrow();
  });

  it('rejects duplicate name', async () => {
    await OilModel.create(validOilInput());

    await expect(
      OilModel.create({
        ...validOilInput(),
        inciName: 'Otro nombre INCI',
      })
    ).rejects.toThrow();
  });

  it('trims whitespace from name', async () => {
    const oil = await OilModel.create({ name: '  Aceite de caléndula  ' });

    expect(oil.name).toBe('Aceite de caléndula');
  });

  it('assigns a stable slug to legacy records missing one before validation', async () => {
    const legacy = new OilModel({ name: 'Aceite de caléndula' });
    legacy.set('slug', undefined);
    await legacy.save();

    expect(legacy.slug).toBe('aceite-de-calendula');
  });

  it('defines only one name index', () => {
    const nameIndexes = OilModel.schema
      .indexes()
      .filter(([fields]: [Record<string, unknown>, unknown]) =>
        JSON.stringify(fields) === JSON.stringify({ name: 1 })
      );

    expect(nameIndexes).toHaveLength(1);
  });

  it('adds createdAt and updatedAt timestamps', async () => {
    const oil = await OilModel.create({ name: 'Aceite de rosa mosqueta' });

    expect(oil.createdAt).toBeInstanceOf(Date);
    expect(oil.updatedAt).toBeInstanceOf(Date);
  });
});

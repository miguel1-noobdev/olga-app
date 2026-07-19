import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { OilModel } from '../src/lib/db/models/oil';
import { OLIVE_OIL_SEED } from './seed-oils.data';

export interface OilSeedModel {
  findOneAndUpdate(
    filter: { slug: string },
    update: { $set: typeof OLIVE_OIL_SEED },
    options: { upsert: boolean; returnDocument: 'after'; runValidators: boolean }
  ): Promise<unknown>;
}

export async function upsertOilSeed(model: OilSeedModel, seed = OLIVE_OIL_SEED): Promise<void> {
  await model.findOneAndUpdate(
    { slug: seed.slug },
    { $set: seed },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
}

async function seedOliveOil() {
  await connectToDatabase();
  await upsertOilSeed(OilModel);

  const [record, count] = await Promise.all([
    OilModel.findOne({ slug: OLIVE_OIL_SEED.slug }).lean(),
    OilModel.countDocuments({ slug: OLIVE_OIL_SEED.slug }),
  ]);
  const database = mongoose.connection.db?.databaseName;

  if (!record || count !== 1) {
    throw new Error(`Olive oil upsert did not produce exactly one record (count: ${count}).`);
  }

  console.log(JSON.stringify({
    database,
    collection: OilModel.collection.name,
    count,
    record: {
      id: record._id.toString(),
      slug: record.slug,
      name: record.name,
      images: record.images,
    },
  }));
}

if (process.argv[1]?.endsWith('seed-oils.ts')) {
  seedOliveOil()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

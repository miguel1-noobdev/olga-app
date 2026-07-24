import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { PlantModel } from '../src/lib/db/models/plant';
import { PLANT_SEEDS } from './seed-plants.data';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedPlants() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    for (const seed of PLANT_SEEDS) {
      const slug = slugify(seed.scientificName);
      const plant = await PlantModel.findOneAndUpdate(
        { slug },
        { ...seed, slug },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );

      console.log(`Plant "${plant.commonName}" synced with slug "${plant.slug}".`);
    }
  } catch {
    console.error('Failed to seed plants: MongoDB operation failed.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedPlants();

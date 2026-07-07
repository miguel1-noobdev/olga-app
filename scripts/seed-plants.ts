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
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';
    console.log(`Connecting to ${uri.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')} ...`);

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
  } catch (error) {
    console.error('Failed to seed plants:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedPlants();

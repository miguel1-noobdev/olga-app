import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { PlantModel } from '../src/lib/db/models/plant';

const LAVENDER_SEED = {
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia Mill.',
  species: 'Lavandula angustifolia',
  family: 'Lamiaceae',
  usedParts: ['Flores', 'Sumidades floridas'],
  compounds: [
    { name: 'Linalool', percentage: '25-38%' },
    { name: 'Acetato de linalilo', percentage: '25-45%' },
    { name: 'Lavandulol' },
    { name: 'Terpinen-4-ol' },
  ],
  properties: {
    oral: ['Ansiolítico', 'Sedante', 'Neuroprotector'],
    topical: ['Antiinflamatorio', 'Cicatrizante', 'Antiséptico', 'Regenerador cutáneo'],
  },
  contraindications: [
    'Hipersensibilidad a la planta',
    'No baños con heridas abiertas',
    'No oral en embarazo/lactancia/niños <12',
  ],
  availableExtracts: [
    { type: 'Aceite Esencial', method: 'Destilación por arrastre de vapor', description: '100% puro' },
    { type: 'Hidrolato', description: 'Agua floral rica en polifenoles' },
    { type: 'Extracto CO2', description: 'Alta estabilidad y pureza de activos' },
  ],
  description:
    'Planta aromática de la familia de las labiadas, reconocida por sus propiedades calmantes y regeneradoras de la piel.',
};

async function seedPlants() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';
    console.log(`Connecting to ${uri.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')} ...`);

    await connectToDatabase();
    console.log('Connected to MongoDB');

    const slug = LAVENDER_SEED.scientificName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await PlantModel.findOne({ slug });

    if (existing) {
      console.log(`Plant "${LAVENDER_SEED.commonName}" already exists (slug: ${slug}). Skipping.`);
    } else {
      const plant = await PlantModel.create({ ...LAVENDER_SEED, slug });
      console.log(`Plant "${plant.commonName}" seeded with slug "${plant.slug}".`);
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

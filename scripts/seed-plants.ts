import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { PlantModel } from '../src/lib/db/models/plant';

interface SeedPlant {
  commonName: string;
  scientificName: string;
  species?: string;
  family: string;
  usedParts: string[];
  compounds: Array<{ name: string; percentage?: string }>;
  properties: { oral: string[]; topical: string[] };
  contraindications: string[];
  availableExtracts: Array<{ type: string; method?: string; description?: string }>;
  description: string;
}

const PLANT_SEEDS: SeedPlant[] = [
  {
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
  },
  {
    commonName: 'Llantén',
    scientificName: 'Plantago major L.',
    family: 'Plantaginaceae',
    usedParts: ['Hojas', 'Sumidades floridas'],
    compounds: [
      { name: 'Mucílagos' },
      { name: 'Iridoides', percentage: 'aucubina' },
      { name: 'Flavonoides' },
      { name: 'Alantoína' },
      { name: 'Ácidos fenólicos' },
    ],
    properties: {
      oral: ['Demulcente', 'Antiinflamatorio'],
      topical: ['Cicatrizante', 'Antiséptico'],
    },
    contraindications: [
      'Hipersensibilidad a la planta',
      'Precaución con semillas si no hay hidratación suficiente',
      'Puede interferir con la absorción de fármacos',
    ],
    availableExtracts: [
      { type: 'Infusión' },
      { type: 'Extracto Fluido' },
      { type: 'Jugo Fresco' },
      { type: 'Oleato' },
      { type: 'Extracto Seco' },
    ],
    description:
      'Planta herbácea perenne del género Plantago en la familia Plantaginaceae, conocida por su gran capacidad de regeneración. El Llantén mayor (P. major) se diferencia por sus hojas anchas y ovaladas, mientras que el Llantén menor (P. lanceolata) tiene hojas largas y lanceoladas. Es muy común en bordes de caminos, prados húmedos y terrenos de cultivo de Europa y América.',
  },
];

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
      const existing = await PlantModel.findOne({ slug });

      if (existing) {
        console.log(`Plant "${seed.commonName}" already exists (slug: ${slug}). Skipping.`);
      } else {
        const plant = await PlantModel.create({ ...seed, slug });
        console.log(`Plant "${plant.commonName}" seeded with slug "${plant.slug}".`);
      }
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

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
    usedParts: ['Sumidades floridas'],
    compounds: [
      { name: 'Linalol', percentage: '20-45%' },
      { name: 'Acetato de linalilo', percentage: '25-47%' },
      { name: 'Lavandulol' },
      { name: 'Terpinen-4-ol' },
    ],
    properties: {
      oral: ['Ansiolítico', 'Sedante'],
      topical: ['Antiinflamatorio', 'Regenerador cutáneo'],
    },
    contraindications: [
      'Hipersensibilidad a la planta',
      'Evitar vía oral en embarazo',
      'Evitar en insuficiencia cardíaca grave en baños',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial' },
      { type: 'Hidrolato' },
      { type: 'Extracto de CO2' },
      { type: 'Oleato' },
      { type: 'Glicerito' },
    ],
    description:
      'Lavandula angustifolia, lavanda, es una especie de planta sufruticosa perenne del género Lavandula en la familia Lamiaceae (Labiadas). Se distingue de otras lavandas (como el espliego o cantueso) por sus hojas lineares más estrechas y su espiga floral más corta y compacta. Es nativa de la región mediterránea occidental, prefiriendo suelos calcáreos, secos y soleados en altitudes de montaña.',
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
  {
    commonName: 'Viborera',
    scientificName: 'Echium albicans Lag. & Rodr.',
    family: 'Boraginaceae',
    usedParts: ['Semillas', 'Sumidades floridas'],
    compounds: [
      { name: 'Ácido esteáridónico', percentage: 'SDA' },
      { name: 'Ácido gamma-linolénico', percentage: 'GLA' },
      { name: 'Ácido alfa-linolénico', percentage: 'ALA' },
      { name: 'Alcaloides pirrolizidínicos' },
    ],
    properties: {
      oral: [],
      topical: ['Regenerador cutáneo', 'Antiinflamatorio', 'Antioxidante', 'Hidratante profundo'],
    },
    contraindications: [
      'Uso interno restringido por toxicidad hepática',
      'No usar en embarazo',
      'No usar en lactancia',
      'No usar en pacientes con daño hepático',
    ],
    availableExtracts: [
      { type: 'Aceite de Semillas', method: 'Prensa en frío' },
      { type: 'Infusión', description: 'Uso externo' },
      { type: 'Extracto Glicólico' },
    ],
    description:
      'Planta herbácea perenne de la familia Boraginaceae, notable por su follaje blanquecino y su alto valor en ácidos grasos esenciales. Se distingue de otras especies del género Echium por sus hojas densamente cubiertas de pelos blancos (tomento), lo que le da un aspecto plateado o albino. Es una especie endémica de las cordilleras Béticas (sur de España), donde crece en roquedos, pedregales y fisuras de rocas calizas, adaptada a condiciones de alta montaña.',
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

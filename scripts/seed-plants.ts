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
    commonName: 'Viborera blanca',
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
  {
    commonName: 'Verbena',
    scientificName: 'Verbena officinalis L.',
    family: 'Verbenaceae',
    usedParts: ['Sumidades floridas', 'Hojas', 'Raíz'],
    compounds: [
      { name: 'Iridoides heterosídicos', percentage: 'mín. 1.5% verbenalina, verbenalósido, hastatósido' },
      { name: 'Glucósidos fenilpropanoides', percentage: 'verbascósido' },
      { name: 'Flavonoides', percentage: 'luteolina, apigenina' },
      { name: 'Taninos' },
      { name: 'Mucílagos' },
      { name: 'Aceite esencial', percentage: 'citral, geraniol' },
    ],
    properties: {
      oral: ['Sedante', 'Ansiolítico', 'Neuroprotector', 'Antitusivo', 'Febrífugo', 'Galactogogo', 'Astringente'],
      topical: ['Antiinflamatorio'],
    },
    contraindications: [
      'Embarazo (efecto uterotónico/abortivo)',
      'Hipotiroidismo (acción antitiroidea)',
      'Niños menores de 12 años',
      'Anemia ferropénica (taninos quelan el hierro)',
      'Puede interactuar con anticoagulantes y antihipertensivos',
    ],
    availableExtracts: [
      { type: 'Infusión', description: '1.5 - 2 g por taza para ansiedad o tos' },
      { type: 'Extracto Fluido / Tintura', description: 'Formas concentradas para afecciones reumáticas o insomnio' },
      { type: 'Decocción', description: 'Uso externo: lavados de heridas, eccemas o gargarismos para gingivitis' },
    ],
    description:
      'Planta herbácea perenne de porte erecto (30-100 cm) con tallos cuadrangulares ramificados y hojas opuestas rugosas. Se distingue de la hierba luisa (Aloysia citriodora) por carecer de su intenso aroma cítrico. Es una especie ruderal y nitrófila que coloniza rápidamente bordes de caminos y terrenos baldíos. Es nativa de Europa, Asia y África, pero está naturalizada en toda América.',
  },
  {
    commonName: 'Ortiga',
    scientificName: 'Urtica dioica L.',
    family: 'Urticaceae',
    usedParts: ['Hojas', 'Sumidades aéreas', 'Raíces', 'Rizomas', 'Semillas'],
    compounds: [
      { name: 'Ácidos fenólicos', description: 'hojas: ácido clorogénico, cafeico' },
      { name: 'Flavonoides', description: 'hojas: quercetina, rutina' },
      { name: 'Aminas', description: 'hojas: histamina, serotonina, acetilcolina en pelos urticantes' },
      { name: 'Minerales', description: 'hojas: hierro, calcio, potasio, magnesio' },
      { name: 'Polisacáridos', description: 'raíces' },
      { name: 'Lignanos', description: 'raíces' },
      { name: 'Fitoesteroles', description: 'raíces: β-sitosterol' },
      { name: 'Aglutinina de Urtica dioica', description: 'raíces: UDA' },
    ],
    properties: {
      oral: ['Antiprostático', 'Diurético', 'Depurativo', 'Antiinflamatorio', 'Analgésico', 'Remineralizante'],
      topical: ['Antiinflamatorio', 'Seborregulador', 'Remineralizante'],
    },
    contraindications: [
      'Hipersensibilidad a la planta',
      'Embarazo y lactancia',
      'Menores de 12 años',
      'Insuficiencia cardíaca o renal grave',
    ],
    availableExtracts: [
      { type: 'Infusión / Decocción', description: 'Tradicional para afecciones urinarias o reumáticas' },
      { type: 'Jugo de Planta Fresca', description: 'Muy rico en clorofila y minerales, usado como tónico' },
      { type: 'Extracto Fluido / Tintura', description: 'Concentrados hidroalcohólicos para uso interno o lociones capilares' },
      { type: 'Extracto Seco', description: 'Estandarizado en sílice o β-sitosterol para suplementación' },
    ],
    description:
      'Planta herbácea perenne (en el caso de U. dioica) o anual (U. urens) de la familia Urticaceae, caracterizada por la presencia de tricomas o pelos urticantes que funcionan como agujas hipodérmicas al contacto con la piel. La Ortiga mayor (U. dioica) se distingue por ser más alta (hasta 2 metros) y perenne, con rizomas amarillos rastreros, mientras que la Ortiga menor (U. urens) es anual y de menor porte. Es una especie nitrófila (indicadora de suelos ricos en nitrógeno) y prefiere sitios húmedos, bordes de caminos, escombreras y zonas ribereñas en climas templados de todo el mundo.',
  },
  {
    commonName: 'Viborera morada',
    scientificName: 'Echium plantagineum L.',
    family: 'Boraginaceae',
    usedParts: ['Semillas', 'Flores', 'Raíz'],
    compounds: [
      { name: 'Ácido estearidónico', percentage: 'SDA, 12-14%' },
      { name: 'Ácido alfa-linolénico', percentage: 'ALA, 40-41%' },
      { name: 'Gamma-linolénico', percentage: 'GLA' },
      { name: 'Mucílagos' },
      { name: 'Naftoquinonas', description: 'raíz: shikoninas' },
      { name: 'Alcaloides pirrolizidínicos', description: 'planta verde: equimidina' },
    ],
    properties: {
      oral: ['Cardioprotector', 'Neuroprotector'],
      topical: ['Regenerador de la barrera cutánea', 'Antiinflamatorio tópico'],
    },
    contraindications: [
      'Consumo interno de planta cruda o infusiones prohibido por toxicidad hepática acumulativa',
      'Aceite refinado evitar en embarazo',
      'Aceite refinado evitar en lactancia',
      'Aceite refinado evitar con anticoagulantes',
    ],
    availableExtracts: [
      { type: 'Aceite de Semilla Refinado', description: 'Proceso de Super Refining para eliminar APs y proteínas alergénicas' },
      { type: 'Infusión de Flores', description: 'Uso tradicional demulcente (pectoral), hoy se cuestiona por trazas de alcaloides' },
      { type: 'Extracto de Raíz', description: 'Rico en shikoninas con propiedades antimicrobianas' },
    ],
    description:
      'Planta herbácea de la familia Boraginaceae, de ciclo anual o bienal, reconocida por su gran resiliencia y por ser una fuente vegetal excepcional de ácidos grasos ω-3 complejos. Se distingue de la viborera común (E. vulgare) porque solo dos de sus estambres sobresalen claramente de la corola. Posee hojas basales anchas y ovadas en roseta que recuerdan al llantén. Es una especie nitrófila y ruderal, habitual en bordes de caminos, dunas fijas y campos baldíos, desde el nivel del mar hasta los 1200 metros.',
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

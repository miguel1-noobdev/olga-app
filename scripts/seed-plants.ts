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
  {
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis Miller',
    family: 'Asphodelaceae',
    usedParts: ['Gel', 'Látex'],
    compounds: [
      { name: 'Polisacáridos', description: 'gel: acemanano, glucomananos' },
      { name: 'Vitaminas', description: 'gel: A, C, E, B12' },
      { name: 'Minerales', description: 'gel: zinc, magnesio' },
      { name: 'Enzimas', description: 'gel' },
      { name: 'Aminoácidos', description: 'gel: 20 de los 22 necesarios' },
      { name: 'Antraquinonas', description: 'látex: aloína A y B (barbaloína), emodina, cromonas' },
    ],
    properties: {
      oral: ['Laxante estimulante'],
      topical: ['Cicatrizante', 'Regenerador tisular', 'Antiinflamatorio', 'Calmante', 'Hidratante profundo'],
    },
    contraindications: [
      'Uso interno del látex prohibido en embarazo',
      'Uso interno del látex prohibido en lactancia',
      'Niños menores de 12 años',
      'Enfermedades intestinales agudas (Crohn, colitis)',
      'Extracto de hoja entera no decolorado clasificado como posible carcinógeno Grupo 2B por IARC',
    ],
    availableExtracts: [
      { type: 'Gel 1X / Concentrados', description: 'Jugo puro o concentrados (10X, 40X) para cosmética y bebidas' },
      { type: 'Polvo 200X', description: 'Extracto deshidratado de alta pureza (1g equivale a 200g de gel fresco)' },
      { type: 'Látex Seco', description: 'Resina usada en farmacia como laxante potente' },
      { type: 'Extracto de Fitoplacenta', description: 'Innovador extracto obtenido por cultivo de tejidos para hidratación avanzada' },
    ],
    description:
      'Planta suculenta perenne, xerófita y de tallo muy corto, perteneciente a una de las estirpes medicinales más importantes del mundo. Es reconocida por su capacidad de almacenar agua en un gel parenquimatoso altamente complejo. Se distingue por sus hojas largas (60-100 cm), carnosas y lanceoladas con márgenes serrados provistos de dientes blancos. A diferencia de otros aloes, A. barbadensis presenta flores amarillas tubulares en espigas de hasta 90 cm. Es nativa de la Península Arábiga, pero se ha naturalizado en regiones áridas y subtropicales de todo el mundo.',
  },
  {
    commonName: 'Diente de León',
    scientificName: 'Taraxacum officinale (L.) Weber ex F.H.Wigg.',
    family: 'Asteraceae',
    usedParts: ['Hojas', 'Raíz', 'Planta entera'],
    compounds: [
      { name: 'Inulina', description: 'raíz: hasta 40% en otoño' },
      { name: 'Lactonas sesquiterpénicas', description: 'raíz: taraxacósido, taraxacina' },
      { name: 'Triterpenos', description: 'raíz: taraxasterol' },
      { name: 'Esteroles', description: 'raíz' },
      { name: 'Potasio', description: 'hojas: hasta 5% del peso seco' },
      { name: 'Polifenoles', description: 'hojas: ácido chicórico, caftárico' },
      { name: 'Flavonoides', description: 'hojas: luteolina-7-glucósido' },
      { name: 'Vitaminas', description: 'hojas: A, B, C, D' },
    ],
    properties: {
      oral: ['Diurético', 'Colerético', 'Colagogo', 'Ayuda digestiva', 'Reconstituyente', 'Remineralizante'],
      topical: [],
    },
    contraindications: [
      'Obstrucción de las vías biliares',
      'Colangitis',
      'Cálculos biliares',
      'Embarazo y lactancia',
      'Niños menores de 12 años',
      'Contacto con látex fresco puede causar dermatitis de contacto',
    ],
    availableExtracts: [
      { type: 'Infusión/Decocción', description: '4-10 g de hojas o 3-5 g de raíz' },
      { type: 'Jugo fresco', description: '5-10 mL de hojas expresadas' },
      { type: 'Tintura', description: '1:5, 5-10 mL tres veces al día antes de las comidas' },
      { type: 'Sucedáneo de Café', description: 'Raíces de otoño secadas, tostadas y molidas' },
    ],
    description:
      'Planta herbácea perenne, hemicriptófita y laticífera, reconocida por su raíz napiforme vigorosa que puede profundizar hasta 4.6 metros en condiciones óptimas. Se caracteriza por sus hojas en roseta basal con márgenes runcinados y sus escapos florales huecos que culminan en un capítulo amarillo solitario. Es una especie cosmopolita, ruderal y nitrófila obligada, que prospera con vigor en suelos antropizados, praderas húmedas y bordes de caminos desde el nivel del mar hasta los 1800 m.',
  },
  {
    commonName: 'Toronjil',
    scientificName: 'Melissa officinalis L.',
    family: 'Lamiaceae',
    usedParts: ['Hoja'],
    compounds: [
      { name: 'Ácido rosmarínico', percentage: 'hasta 6%' },
      { name: 'Ácidos melítricos A y B', description: 'exclusivos de la especie' },
      { name: 'Ácido clorogénico' },
      { name: 'Ácido cafeico' },
      { name: 'Aceite esencial', percentage: '0.02-0.37%, citral, citronelal, geraniol, β-cariofileno' },
      { name: 'Flavonoides', description: 'luteolina, apigenina, quercetina' },
      { name: 'Taninos' },
      { name: 'Ácidos triterpénicos', description: 'ursólico, oleanólico' },
    ],
    properties: {
      oral: ['Sedante', 'Ansiolítico', 'Digestivo', 'Carminativo', 'Antiespasmódico', 'Potenciador cognitivo'],
      topical: ['Antiviral tópico'],
    },
    contraindications: [
      'Embarazo (riesgo teratogénico por citral y efecto uterotónico)',
      'Hipotiroidismo (puede inhibir TSH)',
      'Niños menores de 12 años',
      'Aceite esencial puro extremadamente tóxico e irritante si no se diluye',
      'Puede reducir la capacidad de conducir por efecto sedante',
    ],
    availableExtracts: [
      { type: 'Infusión', description: '1.5 - 4.5 g de droga por taza, varias veces al día' },
      { type: 'Extracto Fluido', description: '1:1, 2 - 4 mL tres veces al día' },
      { type: 'Tintura', description: '1:5, 2 - 6 mL tres veces al día' },
      { type: 'Uso Tópico', description: 'Cremas o soluciones acuosas para herpes labial' },
    ],
    description:
      'Planta herbácea perenne y vivaz de porte arbustivo (30-100 cm), también conocida como Melisa, caracterizada por sus tallos erectos de sección cuadrangular y un intenso aroma cítrico al estrujar sus hojas. Es nativa de la región del Mediterráneo oriental y Asia occidental, aunque se ha naturalizado en regiones templadas de todo el mundo. Debe distinguirse de la Hierba Luisa (Aloysia citriodora), que es un arbusto con un perfil fitoquímico distinto (mayor contenido de citral) y un marco regulatorio independiente. Se reconocen tres subespecies: officinalis, altissima e inodora.',
  },
  {
    commonName: 'Rosa Mosqueta',
    scientificName: 'Rosa canina L.',
    family: 'Rosaceae',
    usedParts: ['Pseudofruto', 'Semillas', 'Pétalos', 'Raíz'],
    compounds: [
      { name: 'Vitamina C', description: 'cinorrodón: 500-2000 mg/100g' },
      { name: 'Vitaminas', description: 'cinorrodón: E, A, K, complejo B' },
      { name: 'Flavonoides', description: 'cinorrodón: quercetina, tilirosido' },
      { name: 'Galactolípido GOPO', description: 'cinorrodón' },
      { name: 'Ácido linoleico', description: 'semillas: 51-52%' },
      { name: 'Ácido α-linolénico', description: 'semillas: 19-40%' },
      { name: 'Carotenoides', description: 'semillas' },
      { name: 'Tocoferoles', description: 'semillas' },
      { name: 'Taninos elágicos', description: 'raíz y hojas: rugosinas' },
    ],
    properties: {
      oral: ['Antiinflamatorio', 'Condroprotector', 'Antioxidante', 'Inmunomodulador', 'Astringente'],
      topical: ['Regenerador dérmico', 'Cicatrizante'],
    },
    contraindications: [
      'Litiasis renal',
      'Hemocromatosis',
      'Déficit de G6PD',
      'Suspender 14 días antes de cirugía por riesgo de sangrado',
    ],
    availableExtracts: [
      { type: 'Polvo Estandarizado', description: 'Secado a menos de 40°C para preservar GOPO, para salud articular' },
      { type: 'Aceite de Semilla', description: 'Prensado en frío para uso dermatológico y regeneración de cicatrices' },
      { type: 'Infusión', description: 'Tónico vitamínico y diurético suave' },
      { type: 'Macerado Glicerinado', description: 'Gemoterapia de brotes tiernos' },
    ],
    description:
      'Arbusto vigoroso de porte desordenado y ramas sarmentosas, también conocido como Rosal Silvestre, que alcanza habitualmente los 2 a 4 metros, aunque puede llegar a los 12 metros si cuenta con apoyo para trepar. Se caracteriza por sus tallos provistos de aguijones falciformes y sus pseudofrutos carnosos (cinorrodones) de un rojo escarlata brillante. Se distingue diagnósticamente de otras rosas por tener folíolos completamente glabros en ambas caras y sépalos que se desprenden precozmente antes de la maduración del fruto. Es nativa de la región Paleártica, siendo común en toda la Península Ibérica hasta los 1500 msnm, y se ha naturalizado con éxito en los valles interandinos de Chile y Perú hasta los 4000 msnm.',
  },
  {
    commonName: 'Romero',
    scientificName: 'Salvia rosmarinus Spenn.',
    family: 'Lamiaceae',
    usedParts: ['Hojas', 'Sumidades floridas'],
    compounds: [
      { name: '1,8-cineol', description: 'aceite esencial: 15-55%' },
      { name: 'Alfa-pineno', description: 'aceite esencial: hasta 80%' },
      { name: 'Alcanfor', description: 'aceite esencial: 10-35%' },
      { name: 'Borneol', description: 'aceite esencial' },
      { name: 'Verbenona', description: 'aceite esencial' },
      { name: 'Campheno', description: 'aceite esencial' },
      { name: 'Ácido carnósico', description: 'diterpeno fenólico' },
      { name: 'Carnosol', description: 'diterpeno fenólico' },
      { name: 'Ácido rosmarínico', description: 'hidrosoluble' },
      { name: 'Ácido cafeico' },
      { name: 'Flavonoides', description: 'luteolina, apigenina, genkwanina' },
    ],
    properties: {
      oral: ['Antioxidante', 'Hepatoprotector', 'Neuroprotector', 'Nootrópico', 'Antiinflamatorio', 'Analgésico', 'Antiespasmódico', 'Mucolítico'],
      topical: ['Dermatológico', 'Estimulante de microcirculación cutánea'],
    },
    contraindications: [
      'Obstrucción de conductos biliares',
      'Colelitiasis',
      'Embarazo y lactancia',
      'No recomendado menores de 12 años (oral)',
      'No recomendado menores de 18 años (aceite esencial)',
      'Hipersensibilidad, riesgo de dermatitis de contacto y fotosensibilidad',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial', description: 'Destilado por vapor, uso tópico y aromaterapia' },
      { type: 'Extracto Hidroalcohólico', description: 'Estandarizado en ácido rosmarínico y ácido carnósico' },
      { type: 'Infusión', description: '2 g de hoja por taza para dispepsias y espasmos digestivos leves' },
    ],
    description:
      'Arbusto perenne, leñoso y densamente ramificado, también conocido como Rosmarino, que alcanza habitualmente de 1 a 1,5 metros de altura, aunque puede llegar a los 2 metros en condiciones óptimas. Se distingue por sus hojas sésiles, coriáceas y lineares (tipo aguja), de haz verde oscuro brillante y envés blanquecino debido a una densa cobertura de tricomas glandulares que albergan sus aceites esenciales. Sus flores son bilabiadas, de color azul pálido, lila o blanco, agrupadas en racimos axilares cortos. Recientemente reclasificado del género Rosmarinus al género Salvia tras análisis filogenéticos en 2017. Es nativo de la cuenca del Mediterráneo y el norte de África, prosperando en suelos calcáreos, arcillosos o arenosos y exposiciones soleadas hasta los 1500 msnm.',
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

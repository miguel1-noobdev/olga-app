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
  {
    commonName: 'Salvia',
    scientificName: 'Salvia officinalis L.',
    family: 'Lamiaceae',
    usedParts: ['Hoja', 'Sumidades floridas'],
    compounds: [
      { name: 'Alfa-tuyona', description: 'aceite esencial: 10-60%' },
      { name: 'Beta-tuyona', description: 'aceite esencial' },
      { name: 'Alcanfor', description: 'aceite esencial: 5-25%' },
      { name: '1,8-cineol', description: 'aceite esencial' },
      { name: 'Ácido rosmarínico', description: 'compuesto fenólico' },
      { name: 'Flavonoides', description: 'luteolina, apigenina, hispidulina' },
      { name: 'Taninos condensados', description: '3-7%' },
      { name: 'Carnosol', description: 'diterpeno' },
      { name: 'Ácido carnósico', description: 'diterpeno' },
      { name: 'Ácido ursólico', description: 'triterpeno' },
    ],
    properties: {
      oral: ['Antisudoral', 'Regulador térmico', 'Estimulante cognitivo', 'Antibacteriano', 'Antiviral', 'Digestivo', 'Espasmolítico', 'Astringente'],
      topical: ['Astringente'],
    },
    contraindications: [
      'Embarazo y lactancia',
      'Epilepsia',
      'Insuficiencia renal',
      'Tumores estrogéno-dependientes',
    ],
    availableExtracts: [
      { type: 'Polvo / Extracto Seco Estandarizado', description: 'Comprimidos para sofocos y sudores nocturnos' },
      { type: 'Tintura', description: '1:10, uso oral o tópico' },
      { type: 'Aceite Esencial Puro', description: 'Uso restringido, neurotóxico si se ingiere' },
      { type: 'Infusión', description: 'Tónico digestivo, antiséptico bucal y antisudoral' },
    ],
    description:
      'Mata o arbustillo espeso, vivaz y aromático, también conocida como Salvia Oficial, que alcanza habitualmente de 30 a 90 cm de altura, aunque puede llegar a los 150 cm. Se caracteriza por sus tallos erectos, ramificados y leñosos en la base, con hojas de textura rugosa y flores dispuestas en verticilos de color violeta, azul, blanco o rosado. Se distingue por sus hojas opuestas, lanceolado-elípticas y vellosas, con un color verde grisáceo por el haz y blanquecino por el envés debido a la densidad de sus tricomas. Es nativa de la región mediterránea, donde crece en peñascos, terrenos calcáreos y secos desde el nivel del mar hasta zonas montañosas. Se ha naturalizado en Europa central, Asia Menor y zonas templadas de América.',
  },
  {
    commonName: 'Salvia rosa',
    scientificName: 'Salvia microphylla Kunth',
    family: 'Lamiaceae',
    usedParts: ['Hojas', 'Flores'],
    compounds: [
      { name: 'E-cariofileno', description: 'aceite esencial: 34.5%, agonista CB2' },
      { name: 'Germacreno-D', description: 'aceite esencial' },
      { name: '1,8-cineol', description: 'aceite esencial' },
      { name: 'Alcanfor', description: 'aceite esencial' },
      { name: 'Ácido rosmarínico', description: 'fracción no volátil' },
      { name: 'Ácido ursólico', description: 'triterpeno' },
      { name: 'Ácido oleanólico', description: 'triterpeno' },
      { name: 'Salvigenina', description: 'flavonoide' },
      { name: 'Hispidulina', description: 'flavonoide' },
      { name: 'Apigenina', description: 'flavonoide' },
      { name: 'Diterpenos pimarano y neoclerodano', description: 'potencial actividad opioides y GABA' },
    ],
    properties: {
      oral: ['Ansiolítico', 'Gastroenterológico', 'Antimicrobiana', 'Antifúngica'],
      topical: ['Dermatológica', 'Cicatrizante'],
    },
    contraindications: [
      'Gestación y lactancia',
      'Menores de 12 años: reducir dosis a la mitad',
      'Hipersensibilidad a la familia Lamiaceae',
    ],
    availableExtracts: [
      { type: 'Infusión', description: '5-10 g de hoja seca por taza para trastornos digestivos y fiebre' },
      { type: 'Tintura', description: '1:5, 1-1.5 ml para cólicos menstruales y resfriado leve' },
      { type: 'Aceite Esencial', description: 'Difusión respiratoria o diluido 1-2% tópicamente' },
    ],
    description:
      'Arbusto o subarbusto perenne, leñoso y densamente ramificado, también conocido como Granadina, que alcanza habitualmente entre 1 y 1.3 metros de altura. Se caracteriza por sus tallos de sección cuadrangular y sus hojas opuestas, ovadas a elípticas, con márgenes serrados y una textura ligeramente vellosa. Al ser trituradas, las hojas liberan una fragancia compleja similar a la grosella negra. Sus flores son tubulares y bilabiadas, con colores que varían del rojo carmesí al magenta, rosa y blanco. Pertenece al subgénero Calosphace. Se distingue de su pariente cercano Salvia greggii por poseer márgenes foliares serrados y la presencia de un par de papilas dactiliformes en el interior del tubo de la corola. Es nativa de biomas subtropicales de tierras altas, distribuyéndose desde el sureste de Arizona hasta México y Guatemala, prosperando en elevaciones de entre 1,000 y 2,500 msnm.',
  },
  {
    commonName: 'Manzanilla',
    scientificName: 'Matricaria chamomilla L.',
    family: 'Asteraceae',
    usedParts: ['Capítulos florales'],
    compounds: [
      { name: 'Camazuleno', description: 'aceite esencial, color azul violáceo' },
      { name: 'Alfa-bisabolol', description: 'aceite esencial: 27-50.5%' },
      { name: 'Óxidos de bisabolol', description: 'aceite esencial' },
      { name: 'Espiroéteres', description: 'aceite esencial' },
      { name: 'Apigenina-7-glucósido', description: 'flavonoide, marcador de calidad ≥ 0.25%' },
      { name: 'Luteolina', description: 'flavonoide' },
      { name: 'Quercetina', description: 'flavonoide' },
      { name: 'Herniarina', description: 'cumarina' },
      { name: 'Umbeliferona', description: 'cumarina' },
      { name: 'Ácido ferúlico', description: 'ácido fenólico' },
      { name: 'Polisacáridos mucilaginosos', description: 'otros' },
    ],
    properties: {
      oral: ['Antiinflamatoria', 'Espasmolítica', 'Sedante', 'Ansiolítica', 'Protectora digestiva', 'Protectora renal', 'Protectora ósea'],
      topical: ['Cicatrizante', 'Antiinflamatoria'],
    },
    contraindications: [
      'Hipersensibilidad a Asteráceas',
      'Reacción cruzada con polen de girasol o ambrosía',
      'Baños de inmersión total prohibidos con heridas abiertas extensas',
      'Baños de inmersión total prohibidos con fiebre elevada',
      'Baños de inmersión total prohibidos con insuficiencia cardíaca grave',
    ],
    availableExtracts: [
      { type: 'Infusión', description: '2-8 g de flor seca, 3 veces al día para trastornos digestivos' },
      { type: 'Extracto Fluido', description: '1:1, estandarizado en aceite esencial mín 0.30%' },
      { type: 'Extracto Seco Atomizado', description: '1.2% de apigenina' },
      { type: 'Extracto por CO2 Supercrítico', description: 'Obtiene matricina pura sin degradarla a camazuleno' },
    ],
    description:
      'Planta herbácea anual de porte erguido y tallos ramificados, glabros, también conocida como Manzanilla Común o Alemana, que alcanza entre 15 y 60 cm de altura. Posee hojas sésiles y alternas de aspecto plumoso con segmentos filiformes verde brillante. Sus inflorescencias son capítulos pedunculados con flores liguladas blancas en la periferia y flores tubulosas amarillas en el disco central. Su carácter diagnóstico definitivo es el receptáculo floral alargado-cónico, internamente hueco y sin páleas interflorales. Las lígulas blancas se curvan hacia abajo al madurar. Es nativa de Europa meridional/oriental y Asia templada, prosperando en suelos ligeros con pH entre 5.6 y 7.5.',
  },
  {
    commonName: 'Manzanilla Romana',
    scientificName: 'Chamaemelum nobile (L.) All.',
    family: 'Asteraceae',
    usedParts: ['Capítulos florales'],
    compounds: [
      { name: 'Esteres alifáticos', description: 'aceite esencial >80%, ácido angélico y tíglico' },
      { name: 'Angelato de isobutilo', description: 'aceite esencial' },
      { name: 'Angelato de isoamilo', description: 'aceite esencial' },
      { name: 'Nobilina', description: 'lactona sesquiterpénica, sabor amargo' },
      { name: 'Glucósidos de luteolina', description: 'otros' },
      { name: 'Glucósidos de quercetina', description: 'otros' },
      { name: 'Chamaemelósido', description: 'marcador específico' },
    ],
    properties: {
      oral: ['Espasmolítica neuromuscular', 'Antiinflamatoria', 'Sedante suave', 'Antiséptica'],
      topical: ['Antiinflamatoria'],
    },
    contraindications: [
      'Embarazo y lactancia',
      'Asma',
      'Niños menores de 12 años',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial', description: 'Muy valorado en aromaterapia y perfumería por su aroma afrutado' },
      { type: 'Extracto Fluido', description: '1:1 con etanol al 70% para solubilizar nobilina' },
      { type: 'Infusión', description: 'Uso tradicional como tónico digestivo y calmante' },
    ],
    description:
      'Planta herbácea perenne de porte rastrero o decumbente, también conocida como Manzanilla Inglesa, que forma alfombras densas de 10 a 30 cm de altura. Sus tallos son vellosos con hojas verde-grisáceas que desprenden un intenso aroma a manzana al frotarlas. Los capítulos florales suelen ser solitarios sobre pedúnculos largos que se inclinan en fase de capullo. Se distingue por su receptáculo plano o ligeramente convexo, sólido y cubierto de páleas membranosas. Es nativa de la faja atlántica de Europa occidental y Norte de África. Prefiere suelos arenosos, fértiles y requiere riego continuo.',
  },
  {
    commonName: 'Jengibre',
    scientificName: 'Zingiber officinale Roscoe',
    family: 'Zingiberaceae',
    usedParts: ['Rizoma'],
    compounds: [
      { name: 'Gingeroles', description: 'rizoma fresco, principal compuesto pungente' },
      { name: 'Shogaoles', description: 'rizoma seco o cocido, más potentes antiinflamatorios' },
      { name: 'Paradoles', description: 'otros' },
      { name: 'Zingerona', description: 'otros' },
      { name: 'Alfa-zingibereno', description: 'aceite esencial: hasta 35%' },
      { name: 'Ar-curcumeno', description: 'aceite esencial' },
      { name: 'Beta-bisaboleno', description: 'aceite esencial' },
      { name: 'Citral', description: 'aceite esencial' },
      { name: 'Borneol', description: 'aceite esencial' },
      { name: 'Cineol', description: 'aceite esencial' },
    ],
    properties: {
      oral: ['Antiemético', 'Antiinflamatorio', 'Analgésico', 'Antioxidante', 'Gastrointestinal', 'Carminativo'],
      topical: [],
    },
    contraindications: [
      'Embarazo: no superar 1 g de rizoma seco al día, evitar extractos concentrados',
      'Cálculos biliares',
      'No recomendado menores de 6 años para cinetosis',
      'No recomendado menores de 18 años para otros trastornos gastrointestinales',
    ],
    availableExtracts: [
      { type: 'Polvo Seco', description: '1-2 g para cinetosis, una hora antes del viaje' },
      { type: 'Tintura', description: '1:5 o 1:10, 0.25-3 ml según concentración' },
      { type: 'Aceite Esencial', description: 'Aromaterapia, antimicrobiano y antiespasmódico' },
    ],
    description:
      'Planta herbácea perenne que puede superar el metro de altura, caracterizada por un tallo aéreo (pseudotallo) formado por las vainas foliares y hojas lanceoladas. El interés farmacognóstico se centra en su rizoma, un tallo subterráneo modificado, horizontal y ramificado, cuya composición química varía según el quimiotipo y las condiciones de post-cosecha. Es nativo del sudeste asiático, aunque actualmente se cultiva de forma masiva en India, Nigeria y China. Se distingue de otras especies de la familia por su rizoma pungente y aromático, y por la transición química única de gingeroles a shogaoles que ocurre mediante el procesamiento térmico o secado.',
  },
  {
    commonName: 'Rosa Común',
    scientificName: 'Rosa gallica L.',
    family: 'Rosaceae',
    usedParts: ['Pétalos', 'Botones florales'],
    compounds: [
      { name: 'Geraniol', description: 'aceite esencial' },
      { name: 'Beta-citronelol', description: 'aceite esencial' },
      { name: 'Nerol', description: 'aceite esencial' },
      { name: 'Linalol', description: 'aceite esencial' },
      { name: 'Eugenol', description: 'aceite esencial' },
      { name: 'Taninos', description: 'hasta 15%' },
      { name: 'Ácido gálico', description: 'compuesto fenólico' },
      { name: 'Ácido elágico', description: 'compuesto fenólico' },
      { name: 'Cianidol', description: 'antocianósido' },
      { name: 'Quercitrósido', description: 'flavonoide' },
      { name: 'Kaempferol', description: 'flavonoide' },
      { name: 'Astragalina', description: 'flavonoide' },
      { name: 'Vitamina C', description: 'otros' },
    ],
    properties: {
      oral: ['Digestiva', 'Antiespasmódica'],
      topical: ['Cicatrizante', 'Reparadora', 'Antiinflamatoria cutánea', 'Astringente', 'Antiséptica', 'Antibacterial'],
    },
    contraindications: [
      'Hipersensibilidad a los pétalos de rosa',
      'Riesgo de dermatitis por contacto',
      'Embarazo y lactancia',
      'Potencial efecto ulcerogénico en dosis elevadas por vía interna',
    ],
    availableExtracts: [
      { type: 'Infusión', description: '20 g/l para trastornos digestivos leves o afecciones respiratorias' },
      { type: 'Colutorio', description: '30 g/l para gargarismos, lavados oculares o irrigaciones vaginales' },
      { type: 'Hidrolato', description: 'Agua de Rosas, tónico cutáneo y cosmética anti-edad' },
      { type: 'Miel Rosada', description: 'Uso tradicional para aftas y estomatitis' },
      { type: 'Vinagre de Rosas', description: '1/10, compresas para cefaleas y lavados corporales' },
    ],
    description:
      'Arbusto de hábito terrestre y porte bajo, también conocido como Rosal Castellano, que alcanza habitualmente entre 0.5 y 1 metro de altura. Se caracteriza por poseer brotes rectos y ramificados con numerosos aguijones de distintas longitudes y glándulas caulinares. Sus flores son generalmente solitarias, grandes y muy fragantes, con pétalos aterciopelados que varían del rosa intenso al púrpura. Se distingue diagnósticamente de la Rosa canina por su porte significativamente más bajo y por sus sépalos que permanecen unidos al receptáculo hasta la maduración del fruto. Sus hojas tienen generalmente 5 folíolos, de color verde oscuro por el haz y más claros por el envés. Es nativa de Europa central y meridional y de Asia Menor, creciendo de forma silvestre en bosques de pino y encino.',
  },
  {
    commonName: 'Menta',
    scientificName: 'Mentha x piperita L.',
    family: 'Lamiaceae',
    usedParts: ['Parte aérea'],
    compounds: [
      { name: 'Mentol', description: 'aceite esencial: 33-60%' },
      { name: 'Mentona', description: 'aceite esencial: 15-32%' },
      { name: 'Isomentona', description: 'aceite esencial: 2-8%' },
      { name: '1,8-cineol', description: 'aceite esencial: 5-13%' },
      { name: 'Acetato de mentilo', description: 'aceite esencial: 2-11%' },
      { name: 'Mentofurano', description: 'aceite esencial: 1-10%' },
      { name: 'Limoneno', description: 'aceite esencial: 1-7%' },
      { name: 'Beta-mirceno', description: 'aceite esencial' },
      { name: 'Beta-cariofileno', description: 'aceite esencial' },
      { name: 'Pulegona', description: 'aceite esencial' },
      { name: 'Carvona', description: 'aceite esencial' },
      { name: 'Ácido salicílico', description: 'otros' },
    ],
    properties: {
      oral: ['Carminativa', 'Digestiva'],
      topical: ['Antibacteriana', 'Antiinflamatoria', 'Antiséptica', 'Vasodilatadora'],
    },
    contraindications: [
      'El mentol puede aumentar la absorción tópica de otras sustancias como corticoides',
      'Precaución en pieles extremadamente sensibles',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial', description: 'Hidrodestilación, uso en cosmética, higiene bucal y cuidado de pies' },
      { type: 'Infusión', description: 'Menta piperitae folium, beneficios gastrointestinales' },
      { type: 'Productos Tópicos', description: 'Cremas para pies y formulaciones anti-acné' },
    ],
    description:
      'Hierba perenne, rizomatosa o estolonífera, también conocida como Menta Piperita, de origen híbrido (M. aquatica x M. spicata). Sus tallos alcanzan hasta 90 cm de altura, pudiendo ser glabros o más o menos pelosos. Se caracteriza por su intenso aroma y su cultivo extendido en todo el mundo. Aunque su origen exacto es debatido entre la Inglaterra del siglo XVII y el antiguo Egipto, actualmente se cultiva de forma masiva a nivel global. Se distingue por su naturaleza híbrida y su capacidad de propagación mediante rizomas.',
  },
  {
    commonName: 'Menta Acuática',
    scientificName: 'Mentha aquatica L.',
    family: 'Lamiaceae',
    usedParts: ['Hojas', 'Sumidades floridas'],
    compounds: [
      { name: 'Mentofurano', description: 'aceite esencial: 51.26-58.59%' },
      { name: 'Limoneno', description: 'aceite esencial: 5.9-12.0%' },
      { name: 'Trans-beta-ocimeno', description: 'aceite esencial: 5.5-8.1%' },
      { name: 'Ledol', description: 'aceite esencial: 3.0-4.0%' },
      { name: 'Beta-cariofileno', description: 'aceite esencial' },
      { name: '1,8-cineol', description: 'aceite esencial' },
      { name: 'Mentona', description: 'aceite esencial' },
      { name: 'Isomentona', description: 'aceite esencial' },
      { name: 'Pulegona', description: 'aceite esencial' },
      { name: 'Neomentol', description: 'aceite esencial' },
    ],
    properties: {
      oral: ['Antiespasmódica', 'Digestiva', 'Analgésica', 'Antipirética', 'Sedante suave', 'Astringente'],
      topical: ['Antiséptica', 'Antimicrobiana'],
    },
    contraindications: [
      'Mentofurano potencialmente hepatotóxico en dosis muy altas',
      'Evitar aceite esencial puro cerca de nariz y pecho en niños pequeños',
      'No recomendado en obstrucción de vías biliares',
      'No recomendado en enfermedades hepáticas graves',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial', description: 'Hidrodestilación, composición varía entre fases vegetativa y floración' },
      { type: 'Infusión', description: 'Tónico digestivo, emenagogo y afecciones respiratorias' },
      { type: 'Extractos Orgánicos', description: 'Investigación en propiedades neuroquímicas y citotóxicas' },
    ],
    description:
      'Planta herbácea perenne, rizomatosa y vivaz, también conocida como Menta de Agua, que alcanza habitualmente hasta los 90 cm de altura. Se caracteriza por sus tallos de sección cuadrangular, de color verde o púrpura, que varían de pilosos a casi glabros. Sus hojas son opuestas, de forma ovada a ovado-lanceolada, con bordes dentados y un marcado olor mentolado característico. Las flores son diminutas y se agrupan densamente en inflorescencias terminales de color púrpura, rosado o lila. Se distingue de otras mentas por su hábito de crecimiento ligado a ambientes muy húmedos, encontrándose en las orillas de ríos, arroyos, estanques y canales. Es el progenitor genético directo (junto con M. spicata) de la menta piperita. Es nativa de la región Paleártica y se ha naturalizado ampliamente en América y Australia.',
  },
  {
    commonName: 'Cardamomo verde',
    scientificName: 'Elettaria cardamomum (L.) Maton',
    family: 'Zingiberaceae',
    usedParts: ['Semillas', 'Cápsula'],
    compounds: [
      { name: 'Acetato de alfa-terpinilo', description: 'aceite esencial: 30-60%, marcador de calidad' },
      { name: '1,8-cineol', description: 'aceite esencial: 15-50%' },
      { name: 'Ácido protocatecuico', description: 'fracción fenólica' },
      { name: 'Ácido cafeico', description: 'fracción fenólica' },
      { name: 'Ácido siríngico', description: 'fracción fenólica' },
      { name: 'Luteolina', description: 'flavonoide' },
      { name: 'Kaempferol', description: 'flavonoide' },
      { name: 'Quercetina', description: 'flavonoide' },
      { name: 'Manganeso', description: 'mineral: 182 mg/100g' },
      { name: 'Hierro', description: 'mineral' },
      { name: 'Potasio', description: 'mineral' },
      { name: 'Calcio', description: 'mineral' },
    ],
    properties: {
      oral: ['Gastroenterológica', 'Carminativa', 'Gastroprotectora', 'Antiespasmódica', 'Metabólica', 'Respiratoria', 'Broncodilatadora', 'Neurológica', 'Neuroprotectora', 'Antioxidante'],
      topical: [],
    },
    contraindications: [
      'Colelitiasis',
      'Gestación y lactancia',
      'No recomendado aceite esencial en menores de 18 años',
    ],
    availableExtracts: [
      { type: 'Aceite Esencial', description: 'Destilación al vapor, uso en farmacia y perfumería' },
      { type: 'Tintura', description: '1:5, 1-1.5 ml para dispepsias y espasmos' },
      { type: 'Polvo estandarizado', description: '3 g diarios para beneficios metabólicos y cardiovasculares' },
    ],
    description:
      'Planta herbácea perenne, rizomatosa y de gran porte, también conocida como Cardamomo Verde o Verdadero, que alcanza habitualmente entre 2 y 5 metros de altura. Se caracteriza por poseer un rizoma carnoso y nudoso del cual emergen múltiples pseudotallos formados por vainas foliares solapadas. Sus hojas son alternas, lanceoladas, de color verde oscuro y pueden medir hasta 90 cm de largo. El fruto es una cápsula trilocular ovalada de color verde claro que encierra entre 15 y 20 semillas oscuras, pequeñas y altamente aromáticas. Es nativo de las selvas tropicales de los Ghats Occidentales (India) y Sri Lanka, prosperando en altitudes de entre 600 y 1,500 msnm bajo sombra densa. Se distingue diagnósticamente del cardamomo negro (Amomum subulatum) por su perfil sensorial dulce, cítrico y floral y por su quimiotipo rico en acetato de α-terpinilo.',
  },
  {
    commonName: 'Cardamomo negro',
    scientificName: 'Amomum subulatum Roxb.',
    family: 'Zingiberaceae',
    usedParts: ['Semillas', 'Cápsula'],
    compounds: [
      { name: '1,8-cineol', description: 'aceite esencial: 65.50%' },
      { name: 'Limoneno', description: 'aceite esencial: 3.60%' },
      { name: 'Beta-pineno', description: 'aceite esencial: 3.34%' },
      { name: 'Alfa-terpineol', description: 'aceite esencial: 3.30%' },
      { name: 'Alfa-pineno', description: 'aceite esencial: 2.78%' },
    ],
    properties: {
      oral: ['Gastrointestinal', 'Carminativa', 'Estimulante del apetito', 'Respiratoria', 'Expectorante', 'Antiinflamatoria', 'Antiinflamatoria sistémica'],
      topical: [],
    },
    contraindications: [
      'Cálculos biliares',
      'Gestación y lactancia',
    ],
    availableExtracts: [
      { type: 'Polvo de semillas', description: 'Semillas secas molidas para mezclas de especias como garam masala' },
      { type: 'Oleorresina encapsulada', description: 'Liofilización para preservar compuestos volátiles ahumados' },
      { type: 'Cápsulas enteras', description: 'Fruto seco completo para decocciones y curries' },
    ],
    description:
      'Planta herbácea perenne de la familia del jengibre, caracterizada por producir frutos en cápsulas grandes y oscuras que poseen una superficie rugosa y estriada. Estas cápsulas contienen entre 15 y 20 semillas de color marrón oscuro a negro en su madurez. Su perfil sensorial es marcadamente distinto, con un aroma ahumado, terroso y alcanforado, y un sabor fuerte y punzante. A diferencia del cardamomo verdadero (Elettaria cardamomum), el cardamomo negro es nativo de las regiones montañosas del Himalaya (India, Nepal y Bután), lo que le otorga el nombre de "cardamomo de las colinas". Sus cápsulas son de mayor tamaño, color más oscuro y tienen una textura exterior mucho más tosca que las variedades verdes. Es un cultivo fundamental en Nepal.',
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

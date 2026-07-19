export const OLIVE_OIL_SEED = {
  slug: 'aceite-de-oliva',
  name: 'Aceite de oliva',
  hlb: 7,
  solubility: 'Liposoluble',
  skinTypes: ['Madura', 'Seca'],
  absorption: 'Lenta',
  properties: ['Regenerador'],
  phase: 'Oleosa',
  observations: 'Combina bien',
  recommendedPercentage: null,
  images: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Korfu_%28GR%29%2C_Agii_Douli%2C_Olivenhain_--_2018_--_1284-8.jpg',
      alt: 'Olivar de Olea europaea cerca de Agii Douli, Corfú, Grecia',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Aceite_de_oliva.png',
      alt: 'Aceite de oliva producido en el valle del Limarí, Chile',
    },
  ],
} as const;

import type { PlantRecord } from '@/lib/db/repository/plant';

export interface PublicPlant {
  id: string;
  commonName: string;
  scientificName: string;
  slug: string;
  species?: string;
  family: string;
  usedParts: string[];
  compounds: Array<{
    name: string;
    percentage?: string;
    description?: string;
  }>;
  properties: {
    oral: string[];
    topical: string[];
  };
  contraindications: string[];
  availableExtracts: Array<{
    type: string;
    method?: string;
    description?: string;
  }>;
  description?: string;
  images?: Array<{
    url: string;
    alt: string;
  }>;
}

export function toPublicPlant(plant: PlantRecord): PublicPlant {
  return {
    id: plant.id,
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    slug: plant.slug,
    species: plant.species,
    family: plant.family,
    usedParts: plant.usedParts,
    compounds: plant.compounds,
    properties: plant.properties,
    contraindications: plant.contraindications,
    availableExtracts: plant.availableExtracts,
    description: plant.description,
    images: plant.images,
  };
}

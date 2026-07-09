import type { PlantRecord } from '@/lib/db/repository/plant';

/**
 * Public projection for `/jardin-digital`.
 *
 * This layer deliberately strips internal-only fields (the Olga-facing
 * `internal` group and operational metadata such as `createdAt`) from the
 * full plant domain. For full-domain access see `@/lib/plantas/full-domain`,
 * which is the intended entry point for Olga's future dashboard.
 */

export interface PublicPlantImage {
  url: string;
  alt: string;
}

export interface PublicPlantDetail {
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
  images?: PublicPlantImage[];
}

export interface PublicPlantCard {
  id: string;
  commonName: string;
  scientificName: string;
  slug: string;
  family: string;
  description?: string;
  images?: PublicPlantImage[];
}

export function toPublicPlantDetail(plant: PlantRecord): PublicPlantDetail {
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

export function toPublicPlantCard(plant: PlantRecord): PublicPlantCard {
  return {
    id: plant.id,
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    slug: plant.slug,
    family: plant.family,
    description: plant.description,
    images: plant.images,
  };
}

import type { PlantRecord } from '@/lib/db/repository/plant';
import {
  toPublicPlantCard,
  toPublicPlantDetail,
  type PublicPlantCard,
  type PublicPlantDetail,
} from './projection';

/**
 * Builds the public catalog shown on `/jardin-digital`.
 *
 * Rule: every plant loaded into the `plantas` domain is automatically
 * available in the current public projection. There is no editorial
 * visibility workflow yet; the catalog is a direct public view of the
 * repository.
 */
export function buildJardinDigitalCatalog(plants: PlantRecord[]): PublicPlantCard[] {
  return plants.map(toPublicPlantCard);
}

/**
 * Resolves a public plant detail for `/jardin-digital/[slug]`.
 *
 * Rule: any plant reachable by slug in the `plantas` domain is automatically
 * public. A missing plant resolves to `null` so the route can render 404.
 */
export function resolveJardinDigitalPlant(
  plant: PlantRecord | null
): PublicPlantDetail | null {
  return plant ? toPublicPlantDetail(plant) : null;
}

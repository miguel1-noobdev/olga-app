import {
  createPlantRepository,
  type PlantRecord,
  type PlantRepository,
} from '@/lib/db/repository/plant';

/**
 * Full-domain plant access layer.
 *
 * This module is the intentional entry point for Olga's future dashboard
 * ("laboratorio"). It exposes the complete `plantas` domain, including the
 * internal-only fields that belong to production and operation workflows.
 *
 * Rules:
 * - Public `/jardin-digital` pages MUST use the public projection in
 *   `@/lib/jardin-digital/projection` instead of this module.
 * - This module MUST NOT be imported by any public-facing route or component.
 */

export type FullPlant = PlantRecord;
export type FullPlantRepository = PlantRepository;

export function createFullPlantRepository(): FullPlantRepository {
  return createPlantRepository();
}

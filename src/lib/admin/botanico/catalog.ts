import type { CreateOilInput, UpdateOilInput } from '@/lib/db/repository/oil';
import type { CreatePlantInput, UpdatePlantInput } from '@/lib/db/repository/plant';

type SaveSuccess = { success: true; id: string };
type SaveFailure = { success: false; errors: Record<string, string> };
export type BotanicalCatalogSaveResult = SaveSuccess | SaveFailure;

export interface PlantCatalogRepository {
  create(input: CreatePlantInput): Promise<{ id: string }>;
  update(id: string, input: UpdatePlantInput): Promise<{ id: string }>;
}

export interface OilCatalogRepository {
  create(input: CreateOilInput): Promise<{ id: string }>;
  update(id: string, input: UpdateOilInput): Promise<{ id: string }>;
}

export interface BotanicalCatalogDependencies {
  plants: PlantCatalogRepository;
  oils: OilCatalogRepository;
}

export interface PlantCatalogEntry extends CreatePlantInput {
  id?: string;
}

export interface OilCatalogEntry extends CreateOilInput {
  id?: string;
}

function required(value: string | undefined, label: string): string | undefined {
  return value?.trim() ? undefined : `${label} is required.`;
}

function plantErrors(entry: PlantCatalogEntry): Record<string, string> {
  const errors: Record<string, string> = {};
  const commonName = required(entry.commonName, 'Common name');
  const scientificName = required(entry.scientificName, 'Scientific name');
  const family = required(entry.family, 'Family');

  if (commonName) errors.commonName = commonName;
  if (scientificName) errors.scientificName = scientificName;
  if (family) errors.family = family;

  return errors;
}

function oilErrors(entry: OilCatalogEntry): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = required(entry.name, 'Name');

  if (name) errors.name = name;
  if (
    entry.recommendedPercentage !== undefined &&
    entry.recommendedPercentage !== null &&
    (!Number.isFinite(entry.recommendedPercentage) ||
      entry.recommendedPercentage < 0 ||
      entry.recommendedPercentage > 100)
  ) {
    errors.recommendedPercentage = 'Recommended percentage must be between 0 and 100.';
  }

  return errors;
}

export async function savePlantCatalogEntry(
  { plants }: BotanicalCatalogDependencies,
  entry: PlantCatalogEntry
): Promise<BotanicalCatalogSaveResult> {
  const errors = plantErrors(entry);
  if (Object.keys(errors).length > 0) return { success: false, errors };

  const { id, ...input } = entry;
  const saved = id ? await plants.update(id, input) : await plants.create(input);
  return { success: true, id: saved.id };
}

export async function saveOilCatalogEntry(
  { oils }: BotanicalCatalogDependencies,
  entry: OilCatalogEntry
): Promise<BotanicalCatalogSaveResult> {
  const errors = oilErrors(entry);
  if (Object.keys(errors).length > 0) return { success: false, errors };

  const { id, ...input } = entry;
  const saved = id ? await oils.update(id, input) : await oils.create(input);
  return { success: true, id: saved.id };
}

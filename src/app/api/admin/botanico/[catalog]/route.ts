import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  saveOilCatalogEntry,
  savePlantCatalogEntry,
  type OilCatalogEntry,
  type PlantCatalogEntry,
} from '@/lib/admin/botanico/catalog';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';
import { isApprovedPlantImageUrl } from '@/lib/validation/plant-image';
import {
  assertAllowedKeys,
  assertRecord,
  boundedArray,
  boundedString,
  finiteNumber,
  getSafeInputError,
  imageUrl,
  objectId,
  optionalString,
  readJsonObject,
  RuntimeInputError,
} from '@/lib/validation/runtime-input';

interface RouteContext {
  params: { catalog: string };
}

function stringArray(value: unknown, field: string): string[] {
  return boundedArray(value, field, { maxLength: 50 }).map((item) =>
    boundedString(item, field, { maxLength: 200 })
  );
}

function imageEntries(
  value: unknown,
  field: string,
  validateUrl: typeof imageUrl = imageUrl,
): Array<{ url: string; alt: string }> {
  return boundedArray(value, field, { maxLength: 10 }).map((item, index) => {
    const entry = assertRecord(item);
    assertAllowedKeys(entry, ['url', 'alt']);
    return {
      url: validateUrl(entry.url, `${field}[${index}].url`),
      alt: boundedString(entry.alt, `${field}[${index}].alt`, { maxLength: 200 }),
    };
  });
}

function plantImageUrl(value: unknown, field = 'image'): string {
  const url = imageUrl(value, field);
  if (!isApprovedPlantImageUrl(url)) {
    throw new RuntimeInputError(`Invalid ${field}`);
  }

  return url;
}

function parsePlantEntry(body: Record<string, unknown>): PlantCatalogEntry {
  assertAllowedKeys(body, [
    'id', 'commonName', 'scientificName', 'slug', 'species', 'family', 'usedParts',
    'compounds', 'properties', 'contraindications', 'availableExtracts', 'description',
    'images', 'internal',
  ]);

  const entry: PlantCatalogEntry = {
    commonName: boundedString(body.commonName, 'commonName', { maxLength: 200 }),
    scientificName: boundedString(body.scientificName, 'scientificName', { maxLength: 200 }),
    family: boundedString(body.family, 'family', { maxLength: 200 }),
  };

  if (body.id !== undefined) entry.id = objectId(body.id, 'plant id');
  if (body.slug !== undefined) entry.slug = boundedString(body.slug, 'slug', { maxLength: 160 });
  if (body.species !== undefined) entry.species = optionalString(body.species, 'species', { maxLength: 200 });
  if (body.usedParts !== undefined) entry.usedParts = stringArray(body.usedParts, 'usedParts');
  if (body.contraindications !== undefined) entry.contraindications = stringArray(body.contraindications, 'contraindications');
  if (body.description !== undefined) entry.description = optionalString(body.description, 'description', { maxLength: 5_000 });
  if (body.images !== undefined) entry.images = imageEntries(body.images, 'images', plantImageUrl);

  if (body.compounds !== undefined) {
    entry.compounds = boundedArray(body.compounds, 'compounds', { maxLength: 50 }).map((item, index) => {
      const compound = assertRecord(item);
      assertAllowedKeys(compound, ['name', 'percentage', 'description']);
      return {
        name: boundedString(compound.name, `compounds[${index}].name`, { maxLength: 200 }),
        ...(compound.percentage === undefined ? {} : { percentage: optionalString(compound.percentage, `compounds[${index}].percentage`, { maxLength: 100 }) }),
        ...(compound.description === undefined ? {} : { description: optionalString(compound.description, `compounds[${index}].description`, { maxLength: 1_000 }) }),
      };
    });
  }

  if (body.properties !== undefined) {
    const properties = assertRecord(body.properties);
    assertAllowedKeys(properties, ['oral', 'topical']);
    entry.properties = {
      ...(properties.oral === undefined ? {} : { oral: stringArray(properties.oral, 'properties.oral') }),
      ...(properties.topical === undefined ? {} : { topical: stringArray(properties.topical, 'properties.topical') }),
    };
  }

  if (body.availableExtracts !== undefined) {
    entry.availableExtracts = boundedArray(body.availableExtracts, 'availableExtracts', { maxLength: 20 }).map((item, index) => {
      const extract = assertRecord(item);
      assertAllowedKeys(extract, ['type', 'method', 'description']);
      return {
        type: boundedString(extract.type, `availableExtracts[${index}].type`, { maxLength: 100 }),
        ...(extract.method === undefined ? {} : { method: optionalString(extract.method, `availableExtracts[${index}].method`, { maxLength: 200 }) }),
        ...(extract.description === undefined ? {} : { description: optionalString(extract.description, `availableExtracts[${index}].description`, { maxLength: 1_000 }) }),
      };
    });
  }

  if (body.internal !== undefined) {
    const internal = assertRecord(body.internal);
    assertAllowedKeys(internal, ['cultivationNotes', 'harvestNotes', 'sourcingNotes', 'preparationNotes', 'notes']);
    entry.internal = {
      ...(internal.cultivationNotes === undefined ? {} : { cultivationNotes: optionalString(internal.cultivationNotes, 'internal.cultivationNotes', { maxLength: 2_000 }) }),
      ...(internal.harvestNotes === undefined ? {} : { harvestNotes: optionalString(internal.harvestNotes, 'internal.harvestNotes', { maxLength: 2_000 }) }),
      ...(internal.sourcingNotes === undefined ? {} : { sourcingNotes: optionalString(internal.sourcingNotes, 'internal.sourcingNotes', { maxLength: 2_000 }) }),
      ...(internal.preparationNotes === undefined ? {} : { preparationNotes: optionalString(internal.preparationNotes, 'internal.preparationNotes', { maxLength: 2_000 }) }),
      ...(internal.notes === undefined ? {} : { notes: optionalString(internal.notes, 'internal.notes', { maxLength: 2_000 }) }),
    };
  }

  return entry;
}

function parseOilEntry(body: Record<string, unknown>): OilCatalogEntry {
  assertAllowedKeys(body, [
    'id', 'slug', 'name', 'inciName', 'hlb', 'phase', 'recommendedPercentage', 'observations',
    'notes', 'solubility', 'skinTypes', 'absorption', 'properties', 'images',
  ]);

  const entry: OilCatalogEntry = {
    name: boundedString(body.name, 'name', { maxLength: 200 }),
  };

  if (body.id !== undefined) entry.id = objectId(body.id, 'oil id');
  if (body.slug !== undefined) entry.slug = boundedString(body.slug, 'slug', { maxLength: 160 });
  if (body.inciName !== undefined) entry.inciName = optionalString(body.inciName, 'inciName', { maxLength: 200 });
  if (body.hlb !== undefined) entry.hlb = finiteNumber(body.hlb, 'hlb', { min: 0, max: 20 });
  if (body.phase !== undefined) entry.phase = optionalString(body.phase, 'phase', { maxLength: 100 });
  if (body.recommendedPercentage !== undefined && body.recommendedPercentage !== null) {
    entry.recommendedPercentage = finiteNumber(body.recommendedPercentage, 'recommendedPercentage', { min: 0, max: 100 });
  } else if (body.recommendedPercentage === null) {
    entry.recommendedPercentage = null;
  }
  if (body.observations !== undefined) entry.observations = optionalString(body.observations, 'observations', { maxLength: 2_000 });
  if (body.notes !== undefined) entry.notes = optionalString(body.notes, 'notes', { maxLength: 2_000 });
  if (body.solubility !== undefined) entry.solubility = optionalString(body.solubility, 'solubility', { maxLength: 200 });
  if (body.absorption !== undefined) entry.absorption = optionalString(body.absorption, 'absorption', { maxLength: 200 });
  if (body.skinTypes !== undefined) entry.skinTypes = stringArray(body.skinTypes, 'skinTypes');
  if (body.properties !== undefined) entry.properties = stringArray(body.properties, 'properties');
  if (body.images !== undefined) entry.images = imageEntries(body.images, 'images');

  return entry;
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (params.catalog !== 'plants' && params.catalog !== 'oils') {
    return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
  }

  try {
    const body = await readJsonObject(request);
    const entry = params.catalog === 'plants'
      ? { kind: 'plant' as const, value: parsePlantEntry(body) }
      : { kind: 'oil' as const, value: parseOilEntry(body) };
    await connectToDatabase();
    const dependencies = {
      plants: createPlantRepository(),
      oils: createOilRepository(),
    };
    const result = entry.kind === 'plant'
      ? await savePlantCatalogEntry(dependencies, entry.value)
      : await saveOilCatalogEntry(dependencies, entry.value);

    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ id: result.id }, { status: entry.value.id ? 200 : 201 });
  } catch (error) {
    const failure = getSafeInputError(error, 'Unable to save catalog entry');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}

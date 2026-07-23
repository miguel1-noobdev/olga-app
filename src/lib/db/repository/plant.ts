import { PlantModel, IPlant, PlantInternal } from '../models/plant';

export interface PlantRecord {
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
  internal?: PlantInternal;
  createdAt: string;
}

export interface CreatePlantInput {
  commonName: string;
  scientificName: string;
  slug?: string;
  species?: string;
  family: string;
  usedParts?: string[];
  compounds?: Array<{ name: string; percentage?: string; description?: string }>;
  properties?: { oral?: string[]; topical?: string[] };
  contraindications?: string[];
  availableExtracts?: Array<{ type: string; method?: string; description?: string }>;
  description?: string;
  images?: Array<{ url: string; alt: string }>;
  internal?: PlantInternal;
}

export interface UpdatePlantInput {
  commonName?: string;
  scientificName?: string;
  slug?: string;
  species?: string;
  family?: string;
  usedParts?: string[];
  compounds?: Array<{ name: string; percentage?: string; description?: string }>;
  properties?: { oral?: string[]; topical?: string[] };
  contraindications?: string[];
  availableExtracts?: Array<{ type: string; method?: string; description?: string }>;
  description?: string;
  images?: Array<{ url: string; alt: string }>;
  internal?: PlantInternal;
}

export interface PlantRepository {
  create(input: CreatePlantInput): Promise<PlantRecord>;
  findById(id: string): Promise<PlantRecord | null>;
  findBySlug(slug: string): Promise<PlantRecord | null>;
  findAll(): Promise<PlantRecord[]>;
  findByFamily(family: string): Promise<PlantRecord[]>;
  searchByName(query: string): Promise<PlantRecord[]>;
  update(id: string, input: UpdatePlantInput): Promise<PlantRecord>;
  delete(id: string): Promise<void>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPlantRecord(doc: IPlant): PlantRecord {
  // Use JSON round-trip to strip all Mongoose prototypes from nested objects/arrays.
  // .toObject() alone doesn't deep-strip subdocument arrays like images[] or compounds[].
  const plain = JSON.parse(JSON.stringify(doc.toObject ? doc.toObject() : doc));
  return {
    id: doc._id.toString(),
    commonName: plain.commonName,
    scientificName: plain.scientificName,
    slug: plain.slug,
    species: plain.species,
    family: plain.family,
    usedParts: plain.usedParts,
    compounds: plain.compounds,
    properties: plain.properties,
    contraindications: plain.contraindications,
    availableExtracts: plain.availableExtracts,
    description: plain.description,
    images: plain.images,
    internal: plain.internal ?? {},
    createdAt: doc.createdAt.toISOString(),
  };
}

export function createPlantRepository(): PlantRepository {
  return {
    async create(input: CreatePlantInput): Promise<PlantRecord> {
      const slug = input.slug || slugify(input.scientificName);

      const plant = await PlantModel.create({
        ...input,
        slug,
      });

      return toPlantRecord(plant);
    },

    async findById(id: string): Promise<PlantRecord | null> {
      const plant = await PlantModel.findById(id);
      return plant ? toPlantRecord(plant) : null;
    },

    async findBySlug(slug: string): Promise<PlantRecord | null> {
      const plant = await PlantModel.findOne({ slug: slug.toLowerCase().trim() });
      return plant ? toPlantRecord(plant) : null;
    },

    async findAll(): Promise<PlantRecord[]> {
      const plants = await PlantModel.find().sort({ commonName: 1 });
      return plants.map(toPlantRecord);
    },

    async findByFamily(family: string): Promise<PlantRecord[]> {
      const plants = await PlantModel.find({ family }).sort({ commonName: 1 });
      return plants.map(toPlantRecord);
    },

    async searchByName(query: string): Promise<PlantRecord[]> {
      const trimmed = query.trim();
      const regex = new RegExp(trimmed, 'i');

      const plants = await PlantModel.find({
        $or: [{ commonName: regex }, { scientificName: regex }],
      }).sort({ commonName: 1 });

      return plants.map(toPlantRecord);
    },

    async update(id: string, input: UpdatePlantInput): Promise<PlantRecord> {
      const existing = await PlantModel.findById(id);

      if (!existing) {
        throw new Error('Plant not found');
      }

      const updateData: UpdatePlantInput = { ...input };

      if (input.scientificName && !input.slug) {
        updateData.slug = slugify(input.scientificName);
      }

      if (input.internal) {
        updateData.internal = {
          ...JSON.parse(JSON.stringify(existing.internal ?? {})),
          ...input.internal,
        };
      }

      const plant = await PlantModel.findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
      });

      if (!plant) {
        throw new Error('Plant not found');
      }

      return toPlantRecord(plant);
    },

    async delete(id: string): Promise<void> {
      const result = await PlantModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error('Plant not found');
      }
    },
  };
}

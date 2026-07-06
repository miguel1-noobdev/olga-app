import { PlantModel, IPlant } from '../models/plant';

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
  createdAt: string;
}

export interface CreatePlantInput {
  commonName: string;
  scientificName: string;
  slug?: string;
  species?: string;
  family: string;
  usedParts?: string[];
  compounds?: Array<{ name: string; percentage?: string }>;
  properties?: { oral?: string[]; topical?: string[] };
  contraindications?: string[];
  availableExtracts?: Array<{ type: string; method?: string; description?: string }>;
  description?: string;
  images?: Array<{ url: string; alt: string }>;
}

export interface UpdatePlantInput {
  commonName?: string;
  scientificName?: string;
  slug?: string;
  species?: string;
  family?: string;
  usedParts?: string[];
  compounds?: Array<{ name: string; percentage?: string }>;
  properties?: { oral?: string[]; topical?: string[] };
  contraindications?: string[];
  availableExtracts?: Array<{ type: string; method?: string; description?: string }>;
  description?: string;
  images?: Array<{ url: string; alt: string }>;
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
  return {
    id: doc._id.toString(),
    commonName: doc.commonName,
    scientificName: doc.scientificName,
    slug: doc.slug,
    species: doc.species,
    family: doc.family,
    usedParts: doc.usedParts,
    compounds: doc.compounds,
    properties: doc.properties,
    contraindications: doc.contraindications,
    availableExtracts: doc.availableExtracts,
    description: doc.description,
    images: doc.images,
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
      const updateData: any = { ...input };

      if (input.scientificName && !input.slug) {
        updateData.slug = slugify(input.scientificName);
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

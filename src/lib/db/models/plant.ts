import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlant extends Document {
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
  createdAt: Date;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PlantSchema = new Schema<IPlant>(
  {
    commonName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    scientificName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    species: {
      type: String,
      trim: true,
    },
    family: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    usedParts: {
      type: [String],
      default: [],
    },
    compounds: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          percentage: { type: String, trim: true },
        },
      ],
      default: [],
    },
    properties: {
      oral: {
        type: [String],
        default: [],
      },
      topical: {
        type: [String],
        default: [],
      },
    },
    contraindications: {
      type: [String],
      default: [],
    },
    availableExtracts: {
      type: [
        {
          type: { type: String, required: true, trim: true },
          method: { type: String, trim: true },
          description: { type: String, trim: true },
        },
      ],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          alt: { type: String, required: true, trim: true },
        },
      ],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

PlantSchema.pre<IPlant>('validate', function () {
  if (!this.slug && this.scientificName) {
    this.slug = slugify(this.scientificName);
  }
});

export const PlantModel: Model<IPlant> =
  mongoose.models.Plant ?? mongoose.model<IPlant>('Plant', PlantSchema);

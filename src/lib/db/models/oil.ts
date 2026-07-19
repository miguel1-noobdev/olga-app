import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOil extends Document {
  slug?: string;
  name: string;
  inciName?: string;
  hlb?: number;
  phase?: string;
  recommendedPercentage?: number | null;
  observations?: string;
  notes?: string;
  solubility?: string;
  skinTypes: string[];
  absorption?: string;
  properties: string[];
  images: Array<{ url: string; alt: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const OilSchema = new Schema<IOil>(
  {
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    inciName: {
      type: String,
      trim: true,
    },
    hlb: {
      type: Number,
    },
    phase: {
      type: String,
      trim: true,
    },
    recommendedPercentage: {
      type: Number,
      default: null,
    },
    observations: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    solubility: {
      type: String,
      trim: true,
    },
    skinTypes: {
      type: [String],
      default: [],
    },
    absorption: {
      type: String,
      trim: true,
    },
    properties: {
      type: [String],
      default: [],
    },
    images: {
      type: [{ url: { type: String, required: true }, alt: { type: String, required: true }, _id: false }],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

function toOilSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

OilSchema.pre('validate', function assignSlug() {
  if (!this.slug && this.name) {
    this.slug = toOilSlug(this.name);
  }
});

export const OilModel: Model<IOil> = mongoose.models.Oil ?? mongoose.model<IOil>('Oil', OilSchema);

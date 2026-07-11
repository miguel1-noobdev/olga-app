import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOil extends Document {
  name: string;
  inciName?: string;
  hlb?: number;
  phase?: string;
  recommendedPercentage?: number | null;
  observations?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OilSchema = new Schema<IOil>(
  {
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
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

export const OilModel: Model<IOil> = mongoose.models.Oil ?? mongoose.model<IOil>('Oil', OilSchema);

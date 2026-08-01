import mongoose, { Document, Model, Schema } from 'mongoose';

export type IdentityProvider = 'credentials' | 'google';

export interface IIdentity extends Document {
  accountId: string;
  provider: IdentityProvider;
  providerAccountId: string;
  email?: string;
  createdAt: Date;
}

const IdentitySchema = new Schema<IIdentity>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

IdentitySchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
IdentitySchema.index({ accountId: 1, provider: 1 }, { unique: true });

export const IdentityModel: Model<IIdentity> =
  mongoose.models.Identity ?? mongoose.model<IIdentity>('Identity', IdentitySchema);

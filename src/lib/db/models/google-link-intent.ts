import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGoogleLinkIntent extends Document {
  accountId: string;
  securityVersion: number;
  stateHash: string;
  nonce: string;
  codeChallenge: string;
  encryptedCodeVerifier: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  providerAccountId?: string;
  email?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

const GoogleLinkIntentSchema = new Schema<IGoogleLinkIntent>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    securityVersion: {
      type: Number,
      required: true,
      min: 0,
    },
    stateHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    nonce: {
      type: String,
      required: true,
    },
    codeChallenge: {
      type: String,
      required: true,
    },
    encryptedCodeVerifier: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    providerAccountId: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

GoogleLinkIntentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
GoogleLinkIntentSchema.index(
  { accountId: 1 },
  {
    name: 'one_unconsumed_intent_per_account',
    unique: true,
    partialFilterExpression: { consumedAt: null },
  },
);

export const GoogleLinkIntentModel: Model<IGoogleLinkIntent> =
  mongoose.models.GoogleLinkIntent ??
  mongoose.model<IGoogleLinkIntent>('GoogleLinkIntent', GoogleLinkIntentSchema);

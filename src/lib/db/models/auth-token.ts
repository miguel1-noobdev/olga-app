import { createHash } from 'node:crypto';
import mongoose, { Document, Model, Schema } from 'mongoose';

export type TokenPurpose = 'email_verification' | 'password_reset' | 'google_link';

export interface IAuthToken extends Document {
  accountId: string;
  purpose: TokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  securityVersion: number;
  createdAt: Date;
}

const AuthTokenSchema = new Schema<IAuthToken>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset', 'google_link'],
      required: true,
    },
    tokenHash: {
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
    securityVersion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthTokenSchema.index({ accountId: 1, purpose: 1, tokenHash: 1 });

export const AuthTokenModel: Model<IAuthToken> =
  mongoose.models.AuthToken ?? mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);

export function hashAuthToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export interface ConsumeAuthTokenInput {
  accountId: string;
  purpose: TokenPurpose;
  rawToken: string;
  now?: Date;
  securityVersion?: number;
}

export async function consumeAuthToken({
  accountId,
  purpose,
  rawToken,
  now = new Date(),
  securityVersion,
}: ConsumeAuthTokenInput): Promise<boolean> {
  const query: Record<string, unknown> = {
    accountId,
    purpose,
    tokenHash: hashAuthToken(rawToken),
    consumedAt: null,
    expiresAt: { $gt: now },
  };

  if (securityVersion !== undefined) {
    query.securityVersion = securityVersion;
  }

  const consumed = await AuthTokenModel.findOneAndUpdate(
    query,
    { $set: { consumedAt: now } },
    { returnDocument: 'after' },
  );

  return consumed !== null;
}

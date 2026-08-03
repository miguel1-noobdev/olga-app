import { createHash } from 'node:crypto';
import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuthEventOutcome = 'success' | 'failure' | 'denied';

export type SafeAuthEventMetadata = Record<string, string | number | boolean>;

export interface RecordAuthEventInput {
  accountId?: string;
  event: string;
  outcome: AuthEventOutcome;
  email?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface IAuthEvent extends Document {
  accountId?: string;
  event: string;
  outcome: AuthEventOutcome;
  emailHash?: string;
  ipHash?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
}

const AuthEventSchema = new Schema<IAuthEvent>(
  {
    accountId: {
      type: String,
      index: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
    },
    outcome: {
      type: String,
      enum: ['success', 'failure', 'denied'],
      required: true,
    },
    emailHash: {
      type: String,
      select: false,
    },
    ipHash: {
      type: String,
      select: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuthEventSchema.index({ accountId: 1, createdAt: -1 });

export const AuthEventModel: Model<IAuthEvent> =
  mongoose.models.AuthEvent ?? mongoose.model<IAuthEvent>('AuthEvent', AuthEventSchema);

const SENSITIVE_METADATA_KEY = /token|password|secret|credential|authorization|cookie/i;

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase(), 'utf8').digest('hex');
}

function safeMetadata(metadata?: Record<string, unknown>): SafeAuthEventMetadata | undefined {
  if (!metadata) return undefined;

  const entries = Object.entries(metadata).filter(([key, value]) =>
    !SENSITIVE_METADATA_KEY.test(key) &&
    (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
  ) as [string, string | number | boolean][];

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function recordAuthEvent(input: RecordAuthEventInput): Promise<void> {
  await AuthEventModel.create({
    accountId: input.accountId,
    event: input.event,
    outcome: input.outcome,
    emailHash: input.email ? hashIdentifier(input.email) : undefined,
    ipHash: input.ip ? hashIdentifier(input.ip) : undefined,
    metadata: safeMetadata(input.metadata),
  });
}

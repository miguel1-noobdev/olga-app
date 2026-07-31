import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuthEventOutcome = 'success' | 'failure' | 'denied';

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

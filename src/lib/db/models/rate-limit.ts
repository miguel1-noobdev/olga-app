import mongoose, { Document, Model, Schema } from 'mongoose';

export type RateLimitSubject = 'email' | 'ip';

export interface IRateLimit extends Document {
  key: string;
  subject: RateLimitSubject;
  hits: number;
  windowStartedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      enum: ['email', 'ip'],
      required: true,
    },
    hits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    windowStartedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

RateLimitSchema.index({ key: 1, subject: 1 }, { unique: true });
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel: Model<IRateLimit> =
  mongoose.models.RateLimit ?? mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

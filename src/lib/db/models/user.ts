import mongoose, { Schema, Document, Model } from 'mongoose';

export type Role = 'suscriptora' | 'productora' | 'admin';
export type AccountStatus = 'pending_email' | 'active' | 'suspended';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: Role;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  securityVersion: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['suscriptora', 'productora', 'admin'],
      default: 'suscriptora',
    },
    accountStatus: {
      type: String,
      enum: ['pending_email', 'active', 'suspended'],
      default: 'active',
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    securityVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

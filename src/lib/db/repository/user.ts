import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/auth/roles';
import { UserModel, IUser, Role, AccountStatus } from '../models/user';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  securityVersion: number;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: Role;
  accountStatus?: AccountStatus;
  emailVerified?: boolean;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findAll(): Promise<UserRecord[]>;
  verifyPassword(user: UserRecord, password: string): Promise<boolean>;
  updatePassword(id: string, password: string): Promise<void>;
  count(): Promise<number>;
  updateRole(id: string, role: Role): Promise<void>;
  updateAccountStatus(id: string, accountStatus: AccountStatus): Promise<void>;
  markEmailVerified(id: string): Promise<boolean>;
  deletePendingRegistration(id: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
  advanceSecurityVersion(id: string): Promise<void>;
}

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_STATUSES: readonly AccountStatus[] = ['pending_email', 'active', 'suspended'];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

function validateEmail(email: string): void {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email format');
  }
}

function toUserRecord(doc: IUser): UserRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    accountStatus: doc.accountStatus ?? 'active',
    emailVerified: doc.emailVerified ?? doc.accountStatus !== 'pending_email',
    securityVersion: doc.securityVersion ?? 0,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function createUserRepository(): UserRepository {
  return {
    async create(input: CreateUserInput): Promise<UserRecord> {
      const email = normalizeEmail(input.email);
      validateEmail(email);
      validatePassword(input.password);

      const existing = await UserModel.findOne({ email });
      if (existing) {
        throw new Error('A user with this email already exists');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const role: Role = input.role ?? ROLES.SUSCRIPTORA;
      const accountStatus: AccountStatus = input.accountStatus ?? 'active';
      const emailVerified = input.emailVerified ?? accountStatus !== 'pending_email';

      const user = await UserModel.create({
        email,
        passwordHash,
        role,
        accountStatus,
        emailVerified,
      });

      return toUserRecord(user);
    },

    async findByEmail(email: string): Promise<UserRecord | null> {
      const normalized = normalizeEmail(email);
      const user = await UserModel.findOne({ email: normalized });
      return user ? toUserRecord(user) : null;
    },

    async findById(id: string): Promise<UserRecord | null> {
      const user = await UserModel.findById(id);
      return user ? toUserRecord(user) : null;
    },

    async findAll(): Promise<UserRecord[]> {
      const users = await UserModel.find({}).sort({ createdAt: -1 });
      return users.map(toUserRecord);
    },

    async verifyPassword(user: UserRecord, password: string): Promise<boolean> {
      return bcrypt.compare(password, user.passwordHash);
    },

    async updatePassword(id: string, password: string): Promise<void> {
      validatePassword(password);
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await UserModel.findByIdAndUpdate(id, { passwordHash });
      if (!result) {
        throw new Error('User not found');
      }
    },

    async count(): Promise<number> {
      return UserModel.countDocuments();
    },

    async updateRole(id: string, role: Role): Promise<void> {
      const result = await UserModel.findByIdAndUpdate(id, { role });
      if (!result) {
        throw new Error('User not found');
      }
    },

    async updateAccountStatus(id: string, accountStatus: AccountStatus): Promise<void> {
      if (!ACCOUNT_STATUSES.includes(accountStatus)) {
        throw new Error('Unsupported account status');
      }

      const result = await UserModel.findByIdAndUpdate(id, { accountStatus });
      if (!result) {
        throw new Error('User not found');
      }
    },

    async markEmailVerified(id: string): Promise<boolean> {
      const result = await UserModel.findOneAndUpdate(
        { _id: id, accountStatus: 'pending_email', emailVerified: false },
        { $set: { accountStatus: 'active', emailVerified: true } },
      );
      return result !== null;
    },

    async deletePendingRegistration(id: string): Promise<boolean> {
      const result = await UserModel.findOneAndDelete({
        _id: id,
        accountStatus: 'pending_email',
        emailVerified: false,
      });
      return result !== null;
    },

    async deleteById(id: string): Promise<boolean> {
      const result = await UserModel.findByIdAndDelete(id);
      return result !== null;
    },

    async advanceSecurityVersion(id: string): Promise<void> {
      const result = await UserModel.findByIdAndUpdate(id, { $inc: { securityVersion: 1 } });
      if (!result) {
        throw new Error('User not found');
      }
    },
  };
}

import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/auth/roles';
import { UserModel, IUser, Role } from '../models/user';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: Role;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  verifyPassword(user: UserRecord, password: string): Promise<boolean>;
  count(): Promise<number>;
  updateRole(id: string, role: Role): Promise<void>;
}

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

      const user = await UserModel.create({
        email,
        passwordHash,
        role,
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

    async verifyPassword(user: UserRecord, password: string): Promise<boolean> {
      return bcrypt.compare(password, user.passwordHash);
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
  };
}
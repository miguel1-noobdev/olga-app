import {
  withMongoLeaseLock,
  type MongoLeaseLockGuard,
  type MongoLeaseLockOptions,
} from '../src/lib/db/mongo-lease-lock';
import { isLastActiveAdmin } from '../src/lib/admin/users/role-change';
import { UserModel } from '../src/lib/db/models/user';
import {
  applyProductoraAccountRecovery,
  createProductoraAccountRecoveryUpdate,
} from './productora-account-recovery';

interface ProductoraAccount {
  _id: { toString(): string };
  passwordHash: string;
  role: string;
  accountStatus: string;
  save(): PromiseLike<unknown>;
}

interface ProductoraDirectoryAccount {
  _id: { toString(): string };
  role: string;
  accountStatus?: string;
}

interface ProductoraProvisioningModel {
  findOne(filter: { email: string }): PromiseLike<ProductoraAccount | null>;
  find(filter: Record<string, unknown>): PromiseLike<ProductoraDirectoryAccount[]>;
  create(input: ReturnType<typeof createProductoraAccountRecoveryUpdate> & { email: string }): PromiseLike<unknown>;
}

type ProductoraLockRunner = <T>(work: (guard: MongoLeaseLockGuard) => Promise<T>, options?: MongoLeaseLockOptions) => Promise<T>;

export async function provisionProductoraAccount(
  email: string,
  passwordHash: string,
  options: {
    model?: ProductoraProvisioningModel;
    lock?: ProductoraLockRunner;
  } = {},
): Promise<void> {
  const model = options.model ?? UserModel;
  const lock = options.lock ?? withMongoLeaseLock;

  await lock(async (guard) => {
    const existingUser = await model.findOne({ email });

    if (existingUser) {
      const directory = await model.find({});
      const isOnlyActiveAdmin = isLastActiveAdmin(
        directory.map((user) => ({
          id: user._id.toString(),
          role: user.role as 'suscriptora' | 'productora' | 'admin',
          accountStatus: (user.accountStatus ?? 'active') as 'active' | 'suspended',
        })),
        existingUser._id.toString(),
      );

      if (isOnlyActiveAdmin) {
        throw new Error('Cannot recover Olga as productora: she is the last active admin.');
      }

      await guard.assertOwnership();
      applyProductoraAccountRecovery(existingUser, passwordHash);
      await guard.assertOwnership();
      await existingUser.save();
      return;
    }

    await guard.assertOwnership();
    await model.create({
      email,
      ...createProductoraAccountRecoveryUpdate(passwordHash),
    });
  });
}

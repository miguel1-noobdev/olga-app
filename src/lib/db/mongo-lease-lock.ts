import mongoose, { Model, Schema } from 'mongoose';
import { randomUUID } from 'node:crypto';

export const MONGO_LEASE_LOCK_DOCUMENT_ID = 'admin-account-mutations';
export const MONGO_LEASE_LOCK_LEASE_TIMEOUT_MS = 15_000;
export const MONGO_LEASE_LOCK_WAIT_TIMEOUT_MS = 10_000;
export const MONGO_LEASE_LOCK_RETRY_DELAY_MS = 50;
export const MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS = 2_000;

export interface MongoLeaseLockDocument {
  _id: string;
  ownerToken: string;
  expiresAt: Date;
}

interface LeaseExpiryFilter {
  _id: string;
  $or: [{ expiresAt: { $lte: Date } }, { expiresAt: { $exists: false } }];
}

interface LeaseUpdate {
  $set: Partial<Pick<MongoLeaseLockDocument, 'ownerToken' | 'expiresAt'>>;
}

interface LeaseOperationOptions {
  upsert: boolean;
  returnDocument: 'after';
  maxTimeMS: number;
}

interface LeaseReadOptions {
  maxTimeMS: number;
}

export interface MongoLeaseLockStore {
  findOneAndUpdate(
    filter: LeaseExpiryFilter | Pick<MongoLeaseLockDocument, '_id' | 'ownerToken'>,
    update: LeaseUpdate,
    options: LeaseOperationOptions,
  ): Promise<MongoLeaseLockDocument | null>;
  findOne(
    filter: Pick<MongoLeaseLockDocument, '_id'>,
    options: LeaseReadOptions,
  ): Promise<MongoLeaseLockDocument | null>;
  deleteOne(filter: Pick<MongoLeaseLockDocument, '_id' | 'ownerToken'>): Promise<{ deletedCount: number }>;
}

const MongoLeaseLockSchema = new Schema<MongoLeaseLockDocument>(
  {
    _id: { type: String, required: true },
    ownerToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'mongo_lease_locks', versionKey: false },
);

const MongoLeaseLockModel: Model<MongoLeaseLockDocument> =
  (mongoose.models.MongoLeaseLock as Model<MongoLeaseLockDocument> | undefined) ??
  mongoose.model<MongoLeaseLockDocument>('MongoLeaseLock', MongoLeaseLockSchema);

const defaultStore: MongoLeaseLockStore = {
  async findOneAndUpdate(filter, update, options) {
    return MongoLeaseLockModel.findOneAndUpdate(filter, update, options).lean().exec() as Promise<MongoLeaseLockDocument | null>;
  },
  async findOne(filter, options) {
    return MongoLeaseLockModel.findOne(filter).maxTimeMS(options.maxTimeMS).lean().exec() as Promise<MongoLeaseLockDocument | null>;
  },
  async deleteOne(filter) {
    return MongoLeaseLockModel.deleteOne(filter).exec();
  },
};

export interface MongoLeaseLockOptions {
  store?: MongoLeaseLockStore;
  ownerToken?: string;
  leaseTimeoutMs?: number;
  waitTimeoutMs?: number;
  retryDelayMs?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  renewalIntervalMs?: number;
}

export interface MongoLeaseLockGuard {
  assertOwnership(): Promise<void>;
}

export interface MongoLeaseLockHandle extends MongoLeaseLockGuard {
  ownerToken: string;
  renew(): Promise<void>;
  release(): Promise<void>;
}

export class MongoLeaseLockUnavailableError extends Error {
  constructor() {
    super('Administrative mutation lock is unavailable.');
    this.name = 'MongoLeaseLockUnavailableError';
  }
}

export class MongoLeaseLockOwnershipLostError extends MongoLeaseLockUnavailableError {
  constructor() {
    super();
    this.message = 'Administrative mutation lock ownership was lost.';
    this.name = 'MongoLeaseLockOwnershipLostError';
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function acquireMongoLeaseLock(
  options: MongoLeaseLockOptions = {},
): Promise<MongoLeaseLockHandle | null> {
  const store = options.store ?? defaultStore;
  const ownerToken = options.ownerToken ?? randomUUID();
  const leaseTimeoutMs = options.leaseTimeoutMs ?? MONGO_LEASE_LOCK_LEASE_TIMEOUT_MS;
  const waitTimeoutMs = options.waitTimeoutMs ?? MONGO_LEASE_LOCK_WAIT_TIMEOUT_MS;
  const retryDelayMs = options.retryDelayMs ?? MONGO_LEASE_LOCK_RETRY_DELAY_MS;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  }));
  const attemptLimit = Math.max(1, Math.ceil(waitTimeoutMs / Math.max(1, retryDelayMs)) + 1);
  const deadline = now() + Math.max(0, waitTimeoutMs);

  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const currentTime = now();
    const expiresAt = new Date(currentTime + leaseTimeoutMs);

    try {
      const document = await store.findOneAndUpdate(
        {
          _id: MONGO_LEASE_LOCK_DOCUMENT_ID,
          $or: [{ expiresAt: { $lte: new Date(currentTime) } }, { expiresAt: { $exists: false } }],
        },
        { $set: { ownerToken, expiresAt } },
        { upsert: true, returnDocument: 'after', maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
      );

      if (document?.ownerToken === ownerToken) {
        let released = false;
        let ownershipLost: MongoLeaseLockOwnershipLostError | null = null;
        return {
          ownerToken,
          async assertOwnership() {
            if (ownershipLost) throw ownershipLost;
            try {
              const document = await store.findOne(
                { _id: MONGO_LEASE_LOCK_DOCUMENT_ID },
                { maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
              );
              if (document?.ownerToken !== ownerToken || document.expiresAt.getTime() <= now()) {
                throw new MongoLeaseLockOwnershipLostError();
              }
            } catch (error) {
              ownershipLost ??= error instanceof MongoLeaseLockOwnershipLostError
                ? error
                : new MongoLeaseLockOwnershipLostError();
              throw ownershipLost;
            }
          },
          async renew() {
            try {
              const renewed = await store.findOneAndUpdate(
                { _id: MONGO_LEASE_LOCK_DOCUMENT_ID, ownerToken },
                { $set: { expiresAt: new Date(now() + leaseTimeoutMs) } },
                { upsert: false, returnDocument: 'after', maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
              );
              if (renewed?.ownerToken !== ownerToken) throw new MongoLeaseLockOwnershipLostError();
            } catch (error) {
              ownershipLost ??= error instanceof MongoLeaseLockOwnershipLostError
                ? error
                : new MongoLeaseLockOwnershipLostError();
              throw ownershipLost;
            }
          },
          async release() {
            if (released) return;
            released = true;
            await store.deleteOne({ _id: MONGO_LEASE_LOCK_DOCUMENT_ID, ownerToken });
          },
        };
      }
    } catch (error) {
      if (!isDuplicateKeyError(error)) return null;
    }

    if (attempt === attemptLimit - 1 || now() >= deadline) return null;
    await sleep(Math.min(retryDelayMs, Math.max(0, deadline - now())));
  }

  return null;
}

export async function withMongoLeaseLock<T>(
  work: (guard: MongoLeaseLockGuard) => Promise<T>,
  options: MongoLeaseLockOptions = {},
): Promise<T> {
  const lock = await acquireMongoLeaseLock(options);
  if (!lock) throw new MongoLeaseLockUnavailableError();
  const renewalIntervalMs = options.renewalIntervalMs ?? Math.max(
    1,
    Math.floor((options.leaseTimeoutMs ?? MONGO_LEASE_LOCK_LEASE_TIMEOUT_MS) / 3),
  );
  let renewing = false;
  let renewalInFlight: Promise<void> | null = null;
  const heartbeat = setInterval(() => {
    if (renewing) return;
    renewing = true;
    renewalInFlight = lock.renew().catch(() => undefined).finally(() => { renewing = false; });
  }, renewalIntervalMs);

  try {
    const result = await work(lock);
    await lock.assertOwnership();
    return result;
  } finally {
    clearInterval(heartbeat);
    if (renewalInFlight) await renewalInFlight;
    try {
      await lock.release();
    } catch (error) {
      console.error('Mongo lease lock cleanup failed; the lease will expire.', error);
    }
  }
}

import { describe, expect, it, vi } from 'vitest';
import {
  acquireMongoLeaseLock,
  MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS,
  MONGO_LEASE_LOCK_WAIT_TIMEOUT_MS,
  MongoLeaseLockOwnershipLostError,
  withMongoLeaseLock,
  type MongoLeaseLockStore,
} from '@/lib/db/mongo-lease-lock';

function createStore(initial: { ownerToken: string; expiresAt: Date } | null = null) {
  let document = initial ? { _id: 'admin-account-mutations', ...initial } : null;
  const findOneAndUpdate = vi.fn(async (filter: Record<string, any>, update: any) => {
    if (filter.ownerToken) {
      if (!document || document.ownerToken !== filter.ownerToken) return null;
    } else {
      const expiry = filter.$or[0].expiresAt.$lte as Date;
      if (document && document.expiresAt > expiry) return null;
    }

    document = {
      _id: 'admin-account-mutations',
      ownerToken: update.$set.ownerToken ?? document?.ownerToken,
      expiresAt: update.$set.expiresAt,
    };
    return document;
  });
  const deleteOne = vi.fn(async (filter: { _id: string; ownerToken: string }) => {
    if (document?._id === filter._id && document.ownerToken === filter.ownerToken) {
      document = null;
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  });
  const findOne = vi.fn(async (filter: { _id: string }) => (
    document?._id === filter._id ? document : null
  ));

  return {
    store: { findOneAndUpdate, findOne, deleteOne } satisfies MongoLeaseLockStore,
    findOneAndUpdate,
    findOne,
    deleteOne,
    getDocument: () => document,
    setOwner: (ownerToken: string) => {
      if (document) document.ownerToken = ownerToken;
    },
  };
}

describe('Mongo lease lock', () => {
  it('uses a socket-aligned best-effort acquisition budget', () => {
    expect(MONGO_LEASE_LOCK_WAIT_TIMEOUT_MS).toBe(10_000);
  });

  it('atomically acquires an unexpired lease and releases only its owner document', async () => {
    const fake = createStore();
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-a',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });

    expect(lock).not.toBeNull();
    expect(fake.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'admin-account-mutations',
        $or: [{ expiresAt: { $lte: new Date(1_000) } }, { expiresAt: { $exists: false } }],
      },
      { $set: { ownerToken: 'owner-a', expiresAt: new Date(6_000) } },
      { upsert: true, returnDocument: 'after', maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
    );

    await lock?.release();
    expect(fake.deleteOne).toHaveBeenCalledWith({
      _id: 'admin-account-mutations',
      ownerToken: 'owner-a',
    });
    expect(fake.getDocument()).toBeNull();
  });

  it('takes over an expired lease', async () => {
    const fake = createStore({ ownerToken: 'stale-owner', expiresAt: new Date(900) });
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-b',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });

    expect(lock).not.toBeNull();
    expect(fake.getDocument()).toMatchObject({ ownerToken: 'owner-b' });
  });

  it('does not release a lease that has already been taken over by another owner', async () => {
    const fake = createStore();
    const firstLock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-a',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });
    const secondLock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-b',
      now: () => 10_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });

    await firstLock?.release();
    expect(fake.getDocument()).toMatchObject({ ownerToken: 'owner-b' });
    await secondLock?.release();
  });

  it('retries duplicate-key upsert races within the bounded wait window', async () => {
    const fake = createStore();
    let duplicate = true;
    fake.findOneAndUpdate.mockImplementationOnce(async () => {
      throw Object.assign(new Error('duplicate key'), { code: 11000 });
    });
    fake.findOneAndUpdate.mockImplementationOnce(async (...args) => {
      duplicate = false;
      return {
        _id: 'admin-account-mutations',
        ownerToken: args[1].$set.ownerToken,
        expiresAt: args[1].$set.expiresAt,
      };
    });

    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-c',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 10,
      retryDelayMs: 1,
      sleep: async () => undefined,
    });

    expect(duplicate).toBe(false);
    expect(fake.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(lock).not.toBeNull();
  });

  it('renews the owner lease with an owner-checked bounded operation', async () => {
    const fake = createStore();
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-renew',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });

    await lock?.renew();

    expect(fake.findOneAndUpdate).toHaveBeenLastCalledWith(
      { _id: 'admin-account-mutations', ownerToken: 'owner-renew' },
      { $set: { expiresAt: new Date(6_000) } },
      { upsert: false, returnDocument: 'after', maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
    );
  });

  it('checks the persisted owner before allowing guarded work to continue', async () => {
    const fake = createStore();
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-assert',
      now: () => 1_000,
      waitTimeoutMs: 0,
    });

    fake.setOwner('successor-owner');

    await expect(lock?.assertOwnership()).rejects.toBeInstanceOf(MongoLeaseLockOwnershipLostError);
    expect(fake.findOne).toHaveBeenCalledWith(
      { _id: 'admin-account-mutations' },
      { maxTimeMS: MONGO_LEASE_LOCK_OPERATION_TIMEOUT_MS },
    );
  });

  it('rejects an expired lease even when the persisted owner is unchanged', async () => {
    const fake = createStore();
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-expired',
      now: () => 1_000,
      leaseTimeoutMs: 5_000,
      waitTimeoutMs: 0,
    });

    fake.getDocument()!.expiresAt = new Date(1_000);

    await expect(lock?.assertOwnership()).rejects.toBeInstanceOf(MongoLeaseLockOwnershipLostError);
  });

  it('renews while work runs and raises when ownership is lost', async () => {
    vi.useFakeTimers();
    try {
      const fake = createStore();
      const work = withMongoLeaseLock(
        () => new Promise<void>((resolve) => setTimeout(resolve, 35)),
        {
          store: fake.store,
          ownerToken: 'owner-heartbeat',
          leaseTimeoutMs: 30,
          renewalIntervalMs: 10,
          waitTimeoutMs: 0,
        },
      );

      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(35);
      expect(fake.findOneAndUpdate.mock.calls.length).toBeGreaterThan(1);
      await expect(work).resolves.toBeUndefined();

      const lostFake = createStore();
      let workFinished = false;
      const lostWork = withMongoLeaseLock(
        (guard) => new Promise<void>((resolve, reject) => setTimeout(async () => {
          workFinished = true;
          try {
            await guard.assertOwnership();
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 35)),
        {
          store: lostFake.store,
          ownerToken: 'owner-lost',
          leaseTimeoutMs: 30,
          renewalIntervalMs: 10,
          waitTimeoutMs: 0,
        },
      );
      const lostExpectation = expect(lostWork).rejects.toBeInstanceOf(MongoLeaseLockOwnershipLostError);
      await vi.advanceTimersByTimeAsync(1);
      lostFake.setOwner('new-owner');
      await vi.advanceTimersByTimeAsync(10);
      expect(workFinished).toBe(false);
      await vi.advanceTimersByTimeAsync(25);
      await lostExpectation;
      expect(workFinished).toBe(true);
      expect(lostFake.getDocument()).toMatchObject({ ownerToken: 'new-owner' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('fails safely after bounded acquisition attempts and releases in finally', async () => {
    const fake = createStore({ ownerToken: 'active-owner', expiresAt: new Date(10_000) });
    const lock = await acquireMongoLeaseLock({
      store: fake.store,
      ownerToken: 'owner-d',
      now: () => 1_000,
      waitTimeoutMs: 2,
      retryDelayMs: 1,
      sleep: async () => undefined,
    });

    expect(lock).toBeNull();
    expect(fake.getDocument()).toMatchObject({ ownerToken: 'active-owner' });

    const releaseStore = createStore();
    await expect(
      withMongoLeaseLock(
        async () => {
          throw new Error('work failed');
        },
        { store: releaseStore.store, ownerToken: 'owner-e', now: () => 1_000, waitTimeoutMs: 0 },
      ),
    ).rejects.toThrow('work failed');
    expect(releaseStore.deleteOne).toHaveBeenCalledWith({
      _id: 'admin-account-mutations',
      ownerToken: 'owner-e',
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { provisionProductoraAccount } from '../scripts/productora-provisioning';

function createAccount(input: Partial<{
  id: string;
  email: string;
  role: string;
  accountStatus: string;
}> = {}) {
  return {
    _id: { toString: () => input.id ?? 'olga-1' },
    email: input.email ?? 'olga@example.test',
    passwordHash: 'old-hash',
    role: input.role ?? 'suscriptora',
    accountStatus: input.accountStatus ?? 'suspended',
    save: vi.fn(async () => undefined),
  };
}

describe('productora provisioning boundary', () => {
  it('rejects recovering Olga when she is the only active admin inside the shared lock', async () => {
    const existing = createAccount({ role: 'admin', accountStatus: 'active' });
    const model = {
      findOne: vi.fn(async () => existing),
      find: vi.fn(async () => [existing]),
      create: vi.fn(),
    };
    const lockCalls = vi.fn();
    const assertOwnership = vi.fn();
    const lock = async <T>(work: (guard: { assertOwnership: () => Promise<void> }) => Promise<T>): Promise<T> => {
      lockCalls();
      return work({ assertOwnership });
    };

    await expect(provisionProductoraAccount('olga@example.test', 'new-hash', { model, lock }))
      .rejects.toThrow('last active admin');
    expect(lockCalls).toHaveBeenCalledTimes(1);
    expect(assertOwnership).not.toHaveBeenCalled();
    expect(existing.save).not.toHaveBeenCalled();
    expect(model.create).not.toHaveBeenCalled();
  });

  it('treats a missing directory account status as active', async () => {
    const existing = createAccount({ role: 'admin', accountStatus: 'active' });
    const model = {
      findOne: vi.fn(async () => existing),
      find: vi.fn(async () => [{ _id: existing._id, role: existing.role }]),
      create: vi.fn(),
    };
    const assertOwnership = vi.fn();
    const lock = async <T>(work: (guard: { assertOwnership: () => Promise<void> }) => Promise<T>): Promise<T> => (
      work({ assertOwnership })
    );

    await expect(provisionProductoraAccount('olga@example.test', 'new-hash', { model, lock }))
      .rejects.toThrow('last active admin');
    expect(assertOwnership).not.toHaveBeenCalled();
    expect(existing.save).not.toHaveBeenCalled();
    expect(model.create).not.toHaveBeenCalled();
  });

  it('updates an existing non-admin Olga account under the shared lock', async () => {
    const existing = createAccount({ role: 'suscriptora', accountStatus: 'suspended' });
    const model = {
      findOne: vi.fn(async () => existing),
      find: vi.fn(async () => [existing]),
      create: vi.fn(),
    };
    const lockCalls = vi.fn();
    const assertOwnership = vi.fn();
    const lock = async <T>(work: (guard: { assertOwnership: () => Promise<void> }) => Promise<T>): Promise<T> => {
      lockCalls();
      return work({ assertOwnership });
    };

    await provisionProductoraAccount('olga@example.test', 'new-hash', { model, lock });

    expect(lockCalls).toHaveBeenCalledTimes(1);
    expect(assertOwnership).toHaveBeenCalled();
    expect(existing).toMatchObject({ passwordHash: 'new-hash', role: 'productora', accountStatus: 'active' });
    expect(existing.save).toHaveBeenCalledTimes(1);
  });
});

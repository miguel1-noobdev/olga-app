import { describe, expect, it, vi } from 'vitest';
import { applyGuardedAdminUserMutation } from '@/lib/admin/users/guarded-mutation';

type StateUser = {
  id: string;
  email: string;
  role: 'suscriptora' | 'productora' | 'admin';
  accountStatus: 'active' | 'suspended';
  createdAt: string;
  passwordHash: string;
};

function createState(users: StateUser[]) {
  const state = new Map(users.map((user) => [user.id, { ...user }]));
  const repository = {
    findAll: async () => [...state.values()],
    findById: async (id: string) => state.get(id) ?? null,
    updateRole: async (id: string, role: StateUser['role']) => {
      const user = state.get(id);
      if (user) user.role = role;
    },
    updateAccountStatus: async (id: string, accountStatus: StateUser['accountStatus']) => {
      const user = state.get(id);
      if (user) user.accountStatus = accountStatus;
    },
  };

  return { repository, state };
}

function serializedLock() {
  let tail = Promise.resolve();
  return async <T>(work: () => Promise<T>): Promise<T> => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  };
}

const admin = (id: string): StateUser => ({
  id,
  email: `${id}@example.test`,
  role: 'admin',
  accountStatus: 'active',
  createdAt: '2026-07-16T00:00:00.000Z',
  passwordHash: 'secret',
});

describe('guarded administrative user mutations', () => {
  it('allows only one of two concurrent admin demotions to remove the last active admin', async () => {
    const fake = createState([admin('admin-1'), admin('admin-2')]);
    const lock = serializedLock();
    const audit = { record: async () => undefined };
    const assertOwnership = vi.fn();

    const outcomes = await Promise.all([
      lock(() => applyGuardedAdminUserMutation(
        { userId: 'admin-1', role: 'productora', confirmed: true },
        'operator-1',
        { users: fake.repository, audit, assertOwnership },
      )),
      lock(() => applyGuardedAdminUserMutation(
        { userId: 'admin-2', role: 'productora', confirmed: true },
        'operator-2',
        { users: fake.repository, audit, assertOwnership },
      )),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === 200)).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 400)).toHaveLength(1);
    expect([...fake.state.values()].filter((user) => user.role === 'admin' && user.accountStatus === 'active')).toHaveLength(1);
  });

  it('allows only one of two concurrent admin suspensions to remove the last active admin', async () => {
    const fake = createState([admin('admin-1'), admin('admin-2')]);
    const lock = serializedLock();
    const audit = { record: async () => undefined };
    const assertOwnership = vi.fn();

    const outcomes = await Promise.all([
      lock(() => applyGuardedAdminUserMutation(
        { userId: 'admin-1', accountStatus: 'suspended', confirmed: true },
        'operator-1',
        { users: fake.repository, audit, assertOwnership },
      )),
      lock(() => applyGuardedAdminUserMutation(
        { userId: 'admin-2', accountStatus: 'suspended', confirmed: true },
        'operator-2',
        { users: fake.repository, audit, assertOwnership },
      )),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === 200)).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 400)).toHaveLength(1);
    expect([...fake.state.values()].filter((user) => user.role === 'admin' && user.accountStatus === 'active')).toHaveLength(1);
  });

  it('keeps audit rollback inside the guarded operation', async () => {
    const fake = createState([admin('admin-1'), {
      ...admin('user-1'), role: 'suscriptora',
    }]);
    const audit = { record: async () => { throw new Error('audit failure'); } };
    const assertOwnership = vi.fn();

    const outcome = await applyGuardedAdminUserMutation(
      { userId: 'user-1', role: 'productora', confirmed: true },
      'admin-1',
      { users: fake.repository, audit, assertOwnership },
    );

    expect(outcome.status).toBe(500);
    expect(fake.state.get('user-1')?.role).toBe('suscriptora');
  });
});

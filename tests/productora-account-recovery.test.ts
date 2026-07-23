import { describe, expect, it } from 'vitest';
import {
  applyProductoraAccountRecovery,
  createProductoraAccountRecoveryUpdate,
} from '../scripts/productora-account-recovery';

describe('productora account recovery', () => {
  it('restores a suspended existing account without replacing its other fields', () => {
    const existingAccount = {
      email: 'olga@example.test',
      passwordHash: 'old-hash',
      role: 'suscriptora' as const,
      accountStatus: 'suspended' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      profileLabel: 'Existing Olga profile',
    };

    const recoveredAccount = applyProductoraAccountRecovery(existingAccount, 'new-hash');

    expect(recoveredAccount).toBe(existingAccount);
    expect(recoveredAccount).toMatchObject({
      passwordHash: 'new-hash',
      role: 'productora',
      accountStatus: 'active',
      email: 'olga@example.test',
      profileLabel: 'Existing Olga profile',
    });
    expect(recoveredAccount.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('provides the creation and update fields that force the productora role and active status', () => {
    expect(createProductoraAccountRecoveryUpdate('new-hash')).toEqual({
      passwordHash: 'new-hash',
      role: 'productora',
      accountStatus: 'active',
    });
  });
});

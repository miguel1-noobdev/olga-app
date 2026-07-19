import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyAdminAccountRecovery,
  createAdminAccountRecoveryUpdate,
} from '../scripts/admin-account-recovery';

describe('admin account recovery', () => {
  it('restores a suspended existing account without replacing its other fields', () => {
    const existingAccount = {
      email: 'operator@example.test',
      passwordHash: 'old-hash',
      role: 'suscriptora' as const,
      accountStatus: 'suspended' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      profileLabel: 'Existing operator profile',
    };

    const recoveredAccount = applyAdminAccountRecovery(existingAccount, 'new-hash');

    expect(recoveredAccount).toBe(existingAccount);
    expect(recoveredAccount).toMatchObject({
      passwordHash: 'new-hash',
      role: 'admin',
      accountStatus: 'active',
      email: 'operator@example.test',
      profileLabel: 'Existing operator profile',
    });
    expect(recoveredAccount.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('provides the password-reset update that also restores the admin role and active status', () => {
    expect(createAdminAccountRecoveryUpdate('new-hash')).toEqual({
      passwordHash: 'new-hash',
      role: 'admin',
      accountStatus: 'active',
    });
  });
});

describe('admin provisioning hardening', () => {
  it('does not retain the legacy hardcoded admin script or documentation references to it', () => {
    expect(existsSync(resolve(process.cwd(), 'scripts/create-admin-proper.ts'))).toBe(false);

    for (const documentPath of ['docs/scripts.md', 'docs/runbook.md', 'README.md']) {
      const document = readFileSync(resolve(process.cwd(), documentPath), 'utf8');
      expect(document).not.toContain('create-admin-proper.ts');
    }
  });

  it('documents an interactive secret prompt instead of an inline password command', () => {
    const scriptsDocumentation = readFileSync(
      resolve(process.cwd(), 'docs/scripts.md'),
      'utf8'
    );

    expect(scriptsDocumentation).toContain("read -r -s 'ADMIN_PASSWORD?Admin password: '");
    expect(scriptsDocumentation).toContain('npx tsx scripts/create-admin.ts');
    expect(scriptsDocumentation).toContain('unset ADMIN_PASSWORD');
    expect(scriptsDocumentation).not.toMatch(
      /\b[A-Z_]*PASSWORD\s*=\s*\S+\s+(?:npx|npm|node|pnpm|yarn)\b/
    );
  });
});

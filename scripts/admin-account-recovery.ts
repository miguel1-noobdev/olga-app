interface RecoverableAdminAccount {
  passwordHash: string;
  role: string;
  accountStatus: string;
}

export function createAdminAccountRecoveryUpdate(passwordHash: string) {
  return {
    passwordHash,
    role: 'admin' as const,
    accountStatus: 'active' as const,
  };
}

export function applyAdminAccountRecovery<T extends RecoverableAdminAccount>(
  account: T,
  passwordHash: string
): T {
  Object.assign(account, createAdminAccountRecoveryUpdate(passwordHash));
  return account;
}

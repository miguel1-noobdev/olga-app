interface RecoverableProductoraAccount {
  passwordHash: string;
  role: string;
  accountStatus: string;
}

export function createProductoraAccountRecoveryUpdate(passwordHash: string) {
  return {
    passwordHash,
    role: 'productora' as const,
    accountStatus: 'active' as const,
  };
}

export function applyProductoraAccountRecovery<T extends RecoverableProductoraAccount>(
  account: T,
  passwordHash: string
): T {
  Object.assign(account, createProductoraAccountRecoveryUpdate(passwordHash));
  return account;
}

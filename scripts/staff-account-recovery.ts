import { fileURLToPath } from 'node:url';

export interface StaffRecoveryInput {
  userId: string;
  password: string;
}

function isStaffRole(role: string): role is 'productora' | 'admin' {
  return role === 'productora' || role === 'admin';
}

export function createStaffRecoveryReceipt(input: {
  userId: string;
  role: 'productora' | 'admin';
  accountStatus: 'active' | 'suspended' | 'pending_email';
  securityVersion: number;
  applied: boolean;
}) {
  return {
    mode: input.applied ? 'apply' : 'dry-run',
    userId: input.userId,
    role: input.role,
    accountStatus: input.accountStatus,
    securityVersion: input.securityVersion,
    rolePreservation: true,
  } as const;
}

async function readStdin(): Promise<string> {
  let input = '';
  for await (const chunk of process.stdin) input += chunk.toString();
  return input;
}

function parseInput(value: unknown): StaffRecoveryInput {
  if (!value || typeof value !== 'object') throw new Error('Staff recovery input must be an object.');
  const { userId, password } = value as Record<string, unknown>;
  if (typeof userId !== 'string' || typeof password !== 'string') {
    throw new Error('Staff recovery input requires userId and password.');
  }
  return { userId, password };
}

export async function runStaffAccountRecovery(args: readonly string[] = process.argv.slice(2)) {
  if (!args.includes('--dry-run') && !args.includes('--apply')) {
    throw new Error('Staff account recovery requires --dry-run or --apply.');
  }
  if (args.includes('--dry-run') && args.includes('--apply')) {
    throw new Error('Staff account recovery modes are mutually exclusive.');
  }
  if (!args.includes('--stdin')) {
    throw new Error('Staff account recovery requires --stdin.');
  }

  const input = parseInput(JSON.parse(await readStdin()));
  const [{ default: mongoose }, { createUserRepository }] = await Promise.all([
    import('mongoose'),
    import('../src/lib/db/repository/user'),
  ]);
  const { connectToDatabase } = await import('../src/lib/db/connect');
  await connectToDatabase();
  const repo = createUserRepository();
  const user = await repo.findById(input.userId);
  if (!user || !isStaffRole(user.role)) {
    throw new Error('Staff account not found.');
  }

  if (args.includes('--dry-run')) {
    const receipt = createStaffRecoveryReceipt({
      userId: user.id,
      role: user.role,
      accountStatus: user.accountStatus,
      securityVersion: user.securityVersion,
      applied: false,
    });
    console.log(JSON.stringify(receipt, null, 2));
    await mongoose.disconnect();
    return receipt;
  }

  const { recoverStaffAccount } = await import('../src/lib/auth/recovery');
  const result = await recoverStaffAccount(repo, input.userId, input.password);
  const receipt = createStaffRecoveryReceipt({
    userId: result.id,
    role: result.role,
    accountStatus: result.accountStatus,
    securityVersion: result.securityVersion,
    applied: true,
  });
  console.log(JSON.stringify(receipt, null, 2));
  await mongoose.disconnect();
  return receipt;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runStaffAccountRecovery().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Staff account recovery failed.');
    process.exitCode = 1;
  });
}

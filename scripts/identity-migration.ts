import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export interface MigrationUserSnapshot {
  id: string;
  email: string;
  role: 'suscriptora' | 'productora' | 'admin';
  accountStatus?: 'pending_email' | 'active' | 'suspended';
  securityVersion?: number;
}

export interface MigrationChange {
  id: string;
  role: MigrationUserSnapshot['role'];
  accountStatus: 'active';
  securityVersion: 0;
}

export interface IdentityMigrationReceipt {
  receiptId: string;
  mode: 'dry-run';
  generatedAt: string;
  sourceCount: number;
  proposedChanges: MigrationChange[];
  rolePreservation: true;
}

export interface MigrationSignoff {
  receiptId: string;
  approvedBy: string;
  reviewedAt: Date;
}

export function createDryRunReceipt(
  users: readonly MigrationUserSnapshot[],
  generatedAt = new Date(),
): IdentityMigrationReceipt {
  const proposedChanges = users
    .filter((user) => user.accountStatus === undefined || user.securityVersion === undefined)
    .map((user): MigrationChange => ({
      id: user.id,
      role: user.role,
      accountStatus: 'active',
      securityVersion: 0,
    }));
  const payload = {
    mode: 'dry-run' as const,
    generatedAt: generatedAt.toISOString(),
    sourceCount: users.length,
    proposedChanges,
    rolePreservation: true as const,
  };
  const receiptId = createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');

  return { receiptId, ...payload };
}

export function assertReceiptApprovedForApply(
  receipt: IdentityMigrationReceipt,
  signoff?: MigrationSignoff,
): void {
  if (
    receipt.mode !== 'dry-run' ||
    !signoff ||
    signoff.receiptId !== receipt.receiptId ||
    !signoff.approvedBy.trim() ||
    Number.isNaN(signoff.reviewedAt.getTime())
  ) {
    throw new Error(
      'Identity migration apply requires reviewed dry-run receipt and explicit sign-off.',
    );
  }
}

async function readStdin(): Promise<string> {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
  }
  return input;
}

async function readUsersFromDatabase(): Promise<MigrationUserSnapshot[]> {
  const [{ default: mongoose }, { UserModel }, { readSafeScriptTarget }] = await Promise.all([
    import('mongoose'),
    import('../src/lib/db/models/user'),
    import('./safe-target'),
  ]);
  const target = readSafeScriptTarget();
  await mongoose.connect(target.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    const users = await UserModel.find({})
      .select('_id email role accountStatus securityVersion')
      .lean();

    return users.map((user) => ({
      id: String(user._id),
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      securityVersion: user.securityVersion,
    }));
  } finally {
    await mongoose.disconnect();
  }
}

async function readUsersFromStdin(): Promise<MigrationUserSnapshot[]> {
  const input = await readStdin();
  const users: unknown = JSON.parse(input);

  if (!Array.isArray(users)) {
    throw new Error('Identity migration input must be a JSON array.');
  }

  return users as MigrationUserSnapshot[];
}

export async function runIdentityMigration(args: readonly string[] = process.argv.slice(2)) {
  if (args.includes('--apply')) {
    throw new Error(
      'Identity migration apply requires reviewed dry-run receipt and explicit sign-off.',
    );
  }

  if (!args.includes('--dry-run')) {
    throw new Error('Identity migration requires --dry-run.');
  }

  const users = args.includes('--stdin')
    ? await readUsersFromStdin()
    : await readUsersFromDatabase();

  const receipt = createDryRunReceipt(users);
  console.log(JSON.stringify(receipt, null, 2));
  return receipt;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runIdentityMigration().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Identity migration failed.');
    process.exitCode = 1;
  });
}

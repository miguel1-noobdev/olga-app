import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
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
  accountStatus?: 'active';
  securityVersion?: 0;
}

export interface IdentityMigrationReceipt {
  receiptId: string;
  mode: 'dry-run';
  generatedAt: string;
  sourceCount: number;
  proposedChanges: MigrationChange[];
  rolePreservation: true;
}

export interface IdentityMigrationApplyReceipt {
  receiptId: string;
  mode: 'apply';
  appliedAt: string;
  sourceCount: number;
  appliedChanges: MigrationChange[];
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
    .map((user): MigrationChange => {
      const change: MigrationChange = { id: user.id, role: user.role };

      if (user.accountStatus === undefined) change.accountStatus = 'active';
      if (user.securityVersion === undefined) change.securityVersion = 0;

      return change;
    });
  const payload = {
    mode: 'dry-run' as const,
    generatedAt: generatedAt.toISOString(),
    sourceCount: users.length,
    proposedChanges,
    rolePreservation: true as const,
  };
  const receiptId = calculateReceiptId(payload);

  return { receiptId, ...payload };
}

export function assertReceiptApprovedForApply(
  receipt: IdentityMigrationReceipt,
  signoff?: MigrationSignoff,
): void {
  if (
    receipt.mode !== 'dry-run' ||
    receipt.receiptId !== calculateReceiptId({
      mode: receipt.mode,
      generatedAt: receipt.generatedAt,
      sourceCount: receipt.sourceCount,
      proposedChanges: receipt.proposedChanges,
      rolePreservation: receipt.rolePreservation,
    }) ||
    receipt.rolePreservation !== true
  ) {
    throw new Error('Identity migration receipt is invalid.');
  }

  if (
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

function calculateReceiptId(payload: Omit<IdentityMigrationReceipt, 'receiptId'>): string {
  return createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

export async function applyIdentityMigration(
  receipt: IdentityMigrationReceipt,
  signoff?: MigrationSignoff,
  appliedAt = new Date(),
): Promise<IdentityMigrationApplyReceipt> {
  assertReceiptApprovedForApply(receipt, signoff);

  const { UserModel } = await import('../src/lib/db/models/user');
  const { AuthEventModel } = await import('../src/lib/db/models/auth-event');
  const session = await UserModel.db.startSession();

  try {
    await session.withTransaction(async () => {
      for (const change of receipt.proposedChanges) {
        const lifecycleChanges: Record<string, string | number> = {};
        const missingFieldGuards: Record<string, { $exists: false }> = {};

        if (change.accountStatus !== undefined) {
          lifecycleChanges.accountStatus = change.accountStatus;
          missingFieldGuards.accountStatus = { $exists: false };
        }
        if (change.securityVersion !== undefined) {
          lifecycleChanges.securityVersion = change.securityVersion;
          missingFieldGuards.securityVersion = { $exists: false };
        }

        const result = await UserModel.updateOne(
          { _id: change.id, role: change.role, ...missingFieldGuards },
          { $set: lifecycleChanges },
          { session },
        );
        if (result.matchedCount !== 1) {
          throw new Error(`Identity migration role guard failed for account ${change.id}.`);
        }
      }

      await AuthEventModel.create([{
        event: 'identity_migration',
        outcome: 'success',
        metadata: {
          appliedChanges: receipt.proposedChanges.length,
          rolePreservation: true,
        },
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  return {
    receiptId: receipt.receiptId,
    mode: 'apply',
    appliedAt: appliedAt.toISOString(),
    sourceCount: receipt.sourceCount,
    appliedChanges: receipt.proposedChanges,
    rolePreservation: true,
  };
}

async function readStdin(): Promise<string> {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
  }
  return input;
}

async function readUsersFromDatabase(): Promise<MigrationUserSnapshot[]> {
  const mongoose = await connectToScriptDatabase();
  const { UserModel } = await import('../src/lib/db/models/user');

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

async function connectToScriptDatabase() {
  const [{ default: mongoose }, { readSafeScriptTarget }] = await Promise.all([
    import('mongoose'),
    import('./safe-target'),
  ]);
  const target = readSafeScriptTarget();
  await mongoose.connect(target.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  return mongoose;
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
  const applying = args.includes('--apply');
  const dryRunning = args.includes('--dry-run');
  if (applying === dryRunning) {
    throw new Error('Identity migration requires exactly one of --dry-run or --apply.');
  }

  if (applying) {
    const receiptPath = argumentValue(args, '--receipt-file');
    const approvedBy = argumentValue(args, '--approved-by');
    const reviewedAt = argumentValue(args, '--reviewed-at');
    if (!receiptPath || !approvedBy || !reviewedAt) {
      throw new Error(
        'Identity migration apply requires reviewed dry-run receipt and explicit sign-off: --receipt-file, --approved-by, and --reviewed-at.',
      );
    }

    const receipt = JSON.parse(await readFile(receiptPath, 'utf8')) as IdentityMigrationReceipt;
    const mongoose = await connectToScriptDatabase();
    try {
      const result = await applyIdentityMigration(receipt, {
        receiptId: receipt.receiptId,
        approvedBy,
        reviewedAt: new Date(reviewedAt),
      });
      console.log(JSON.stringify(result, null, 2));
      return result;
    } finally {
      await mongoose.disconnect();
    }
  }

  const users = args.includes('--stdin')
    ? await readUsersFromStdin()
    : await readUsersFromDatabase();

  const receipt = createDryRunReceipt(users);
  console.log(JSON.stringify(receipt, null, 2));
  return receipt;
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runIdentityMigration().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Identity migration failed.');
    process.exitCode = 1;
  });
}

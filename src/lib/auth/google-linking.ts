import { IdentityModel } from '@/lib/db/models/identity';
import { createUserRepository } from '@/lib/db/repository/user';
import { normalizeGoogleEmail } from './google';

export type GoogleLinkResult = 'linked' | 'conflict';

export interface GoogleLinkInput {
  accountId: string;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
}

export async function linkGoogleIdentity(input: GoogleLinkInput): Promise<GoogleLinkResult> {
  if (!input.emailVerified) {
    return 'conflict';
  }

  const existing = await IdentityModel.findOne({
    provider: 'google',
    providerAccountId: input.providerAccountId,
  });

  if (existing) {
    return existing.accountId === input.accountId ? 'linked' : 'conflict';
  }

  const account = await createUserRepository().findById(input.accountId);
  if (!account || account.accountStatus !== 'active' || !account.emailVerified) {
    return 'conflict';
  }

  try {
    await IdentityModel.create({
      accountId: input.accountId,
      provider: 'google',
      providerAccountId: input.providerAccountId,
      email: normalizeGoogleEmail(input.email),
    });
    return 'linked';
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return 'conflict';
    }
    throw error;
  }
}

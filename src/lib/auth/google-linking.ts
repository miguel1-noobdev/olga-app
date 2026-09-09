import mongoose from 'mongoose';
import { IdentityModel } from '@/lib/db/models/identity';
import { GoogleLinkIntentModel } from '@/lib/db/models/google-link-intent';
import { UserModel } from '@/lib/db/models/user';
import { normalizeGoogleEmail } from './google';
import { hashGoogleLinkState } from './google-link-intent';
import { ROLES } from './roles';

export interface CompleteVerifiedGoogleLinkInput {
  intentId: string;
  accountId: string;
  securityVersion: number;
  state: string;
  providerAccountId: string;
  email: string;
}

class GoogleLinkDeniedError extends Error {}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function completeVerifiedGoogleLink(
  input: CompleteVerifiedGoogleLinkInput,
): Promise<boolean> {
  await IdentityModel.init();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const completedAt = new Date();
      const account = await UserModel.findOne({
        _id: input.accountId,
        role: ROLES.SUSCRIPTORA,
        accountStatus: 'active',
        emailVerified: true,
        securityVersion: input.securityVersion,
      }).session(session);

      if (!account) {
        throw new GoogleLinkDeniedError();
      }

      const existingIdentity = await IdentityModel.findOne({
        provider: 'google',
        providerAccountId: input.providerAccountId,
      }).session(session);

      if (existingIdentity && existingIdentity.accountId !== input.accountId) {
        throw new GoogleLinkDeniedError();
      }

      if (!existingIdentity) {
        try {
          await new IdentityModel({
            accountId: input.accountId,
            provider: 'google',
            providerAccountId: input.providerAccountId,
            email: normalizeGoogleEmail(input.email),
          }).save({ session });
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            throw new GoogleLinkDeniedError();
          }
          throw error;
        }
      }

      const consumed = await GoogleLinkIntentModel.findOneAndUpdate(
        {
          _id: input.intentId,
          accountId: input.accountId,
          securityVersion: input.securityVersion,
          stateHash: hashGoogleLinkState(input.state),
          consumedAt: null,
          expiresAt: { $gt: completedAt },
        },
        {
          $set: {
            consumedAt: completedAt,
            providerAccountId: input.providerAccountId,
            email: normalizeGoogleEmail(input.email),
            verifiedAt: completedAt,
          },
        },
        { returnDocument: 'after', session },
      );

      if (!consumed) {
        throw new GoogleLinkDeniedError();
      }
    });

    return true;
  } catch (error) {
    if (error instanceof GoogleLinkDeniedError || isDuplicateKeyError(error)) {
      return false;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

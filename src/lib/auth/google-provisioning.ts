import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { IdentityModel, IIdentity } from '@/lib/db/models/identity';
import { UserModel } from '@/lib/db/models/user';
import type { UserRecord, UserRepository } from '@/lib/db/repository/user';
import { ROLES } from './roles';

export type GoogleProvisioningOutcome =
  | { kind: 'authenticated'; user: UserRecord }
  | { kind: 'account_in_use' }
  | { kind: 'denied' };

interface GoogleProvisioningInput {
  providerAccountId: string;
  email: string;
  repository: UserRepository;
}

const denied: GoogleProvisioningOutcome = { kind: 'denied' };
const accountInUse: GoogleProvisioningOutcome = { kind: 'account_in_use' };

export async function provisionGoogleAccount(
  input: GoogleProvisioningInput,
): Promise<GoogleProvisioningOutcome> {
  try {
    await Promise.all([IdentityModel.init(), UserModel.init()]);

    const existingIdentity = await findGoogleIdentity(input.providerAccountId);
    if (existingIdentity) {
      return await resumeGoogleProvisioning(existingIdentity, input);
    }

    const existingEmailOwner = await input.repository.findByEmail(input.email);
    if (existingEmailOwner) {
      const concurrentIdentity = await findGoogleIdentity(input.providerAccountId);
      return concurrentIdentity
        ? await resumeGoogleProvisioning(concurrentIdentity, input)
        : accountInUse;
    }

    const accountId = new Types.ObjectId().toString();
    let reservation: IIdentity;
    try {
      reservation = await IdentityModel.create({
        accountId,
        provider: 'google',
        providerAccountId: input.providerAccountId,
        email: input.email,
        provisioningState: 'pending',
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) return denied;

      const duplicateReservation = await findGoogleIdentity(input.providerAccountId);
      if (!duplicateReservation) return denied;
      return await resumeGoogleProvisioning(duplicateReservation, input);
    }

    return await resumeGoogleProvisioning(reservation, input);
  } catch {
    return denied;
  }
}

async function resumeGoogleProvisioning(
  identity: IIdentity,
  input: GoogleProvisioningInput,
): Promise<GoogleProvisioningOutcome> {
  if (
    identity.provider !== 'google'
    || identity.providerAccountId !== input.providerAccountId
  ) {
    return denied;
  }

  if (identity.provisioningState === undefined || identity.provisioningState === 'active') {
    return authenticateActiveIdentity(identity, input);
  }

  if (identity.provisioningState !== 'pending' || !identity.email) return denied;

  let user = await input.repository.findById(identity.accountId);
  if (!user) {
    const existingEmailOwner = await input.repository.findByEmail(identity.email);
    if (existingEmailOwner) {
      user = await input.repository.findById(identity.accountId);
      if (!user) return accountInUse;
    }

    if (!user) {
      try {
        user = await input.repository.create({
          id: identity.accountId,
          email: identity.email,
          password: randomPassword(),
          role: ROLES.SUSCRIPTORA,
          accountStatus: 'pending_email',
          emailVerified: false,
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) return denied;

        user = await input.repository.findById(identity.accountId);
        if (!user) {
          const emailOwner = await input.repository.findByEmail(identity.email);
          return emailOwner ? accountInUse : denied;
        }
      }
    }
  }

  if (!user || user.email !== identity.email) return denied;

  if (user.accountStatus === 'pending_email' && !user.emailVerified) {
    await input.repository.markEmailVerified(identity.accountId);
    user = await input.repository.findById(identity.accountId);
  }

  if (!user || user.accountStatus !== 'active' || !user.emailVerified) return denied;

  const finalizedIdentity = await IdentityModel.findOneAndUpdate(
    {
      _id: identity._id,
      provider: 'google',
      providerAccountId: input.providerAccountId,
      accountId: identity.accountId,
      provisioningState: 'pending',
    },
    { $set: { provisioningState: 'active' } },
    { returnDocument: 'after' },
  );

  if (finalizedIdentity) {
    return authenticateActiveIdentity(finalizedIdentity, input);
  }

  const currentIdentity = await findGoogleIdentity(input.providerAccountId);
  if (
    !currentIdentity
    || currentIdentity.accountId !== identity.accountId
    || currentIdentity.provisioningState !== 'active'
  ) {
    return denied;
  }

  return authenticateActiveIdentity(currentIdentity, input);
}

async function authenticateActiveIdentity(
  identity: IIdentity,
  input: GoogleProvisioningInput,
): Promise<GoogleProvisioningOutcome> {
  if (
    identity.provider !== 'google'
    || identity.providerAccountId !== input.providerAccountId
    || (identity.provisioningState !== undefined && identity.provisioningState !== 'active')
  ) {
    return denied;
  }

  const user = await input.repository.findById(identity.accountId);
  if (!user || user.accountStatus !== 'active' || !user.emailVerified) return denied;

  return { kind: 'authenticated', user };
}

function findGoogleIdentity(providerAccountId: string): Promise<IIdentity | null> {
  return IdentityModel.findOne({ provider: 'google', providerAccountId });
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 11000;
}

function randomPassword(): string {
  return `google-${randomUUID()}`;
}

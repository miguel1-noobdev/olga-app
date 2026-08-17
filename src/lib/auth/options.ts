import { randomUUID } from 'node:crypto';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import { authorizeWithRepository } from './authorize-credentials';
import {
  getGoogleOAuthConfig,
  isVerifiedGoogleProfile,
  normalizeGoogleEmail,
  resolveGoogleCallbackResult,
} from './google';
import { IdentityModel } from '@/lib/db/models/identity';
import { ROLES } from './roles';
import type { UserRecord, UserRepository } from '@/lib/db/repository/user';

const providers: NonNullable<NextAuthOptions['providers']> = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      await connectToDatabase();
      const repo = createUserRepository();
      return authorizeWithRepository(repo, credentials);
    },
  }),
];

const googleConfig = getGoogleOAuthConfig();
if (googleConfig) {
  providers.push(
    GoogleProvider({
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectToDatabase();

      if (account?.provider !== 'google') {
        return true;
      }

      if (!getGoogleOAuthConfig()) {
        return false;
      }

      if (!isVerifiedGoogleProfile(profile) || !account.providerAccountId) {
        return false;
      }

      const repo = createUserRepository();
      const providerIdentity = await IdentityModel.findOne({
        provider: 'google',
        providerAccountId: account.providerAccountId,
      });

      if (providerIdentity) {
        return signInLinkedSubscriber(repo, providerIdentity.accountId, user);
      }

      const email = normalizeGoogleEmail(profile.email);
      const existingUser = await repo.findByEmail(email);
      const callbackResult = resolveGoogleCallbackResult({
        providerIdentityFound: false,
        credentialsAccountFound: Boolean(existingUser),
      });
      if (callbackResult !== 'denied') {
        return false;
      }

      let createdUser: UserRecord;
      try {
        createdUser = await repo.create({
          email,
          password: randomPassword(),
          role: ROLES.SUSCRIPTORA,
          accountStatus: 'active',
          emailVerified: true,
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) {
          throw error;
        }

        return signInRacedProviderIdentity(repo, account.providerAccountId, user);
      }

      try {
        await IdentityModel.create({
          accountId: createdUser.id,
          provider: 'google',
          providerAccountId: account.providerAccountId,
          email,
        });
      } catch (error) {
        await repo.deleteById(createdUser.id);
        if (!isDuplicateKeyError(error)) {
          throw error;
        }

        return signInRacedProviderIdentity(repo, account.providerAccountId, user);
      }

      Object.assign(user, {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        emailVerified: createdUser.emailVerified,
        securityVersion: createdUser.securityVersion,
      });
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        if (!user.id || !user.role) {
          const repo = createUserRepository();
          const dbUser = await repo.findByEmail(user.email!);

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.securityVersion = dbUser.securityVersion;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
          token.emailVerified = Boolean(user.emailVerified);
          token.securityVersion = user.securityVersion;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.securityVersion = token.securityVersion as number;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

function randomPassword(): string {
  return `google-${randomUUID()}`;
}

async function signInRacedProviderIdentity(
  repo: UserRepository,
  providerAccountId: string,
  user: object,
): Promise<boolean> {
  const racedIdentity = await IdentityModel.findOne({
    provider: 'google',
    providerAccountId,
  });

  if (!racedIdentity) {
    return false;
  }

  return signInLinkedSubscriber(repo, racedIdentity.accountId, user);
}

async function signInLinkedSubscriber(
  repo: UserRepository,
  accountId: string,
  user: object,
): Promise<boolean> {
  const linkedUser = await repo.findById(accountId);
  if (
    !linkedUser ||
    linkedUser.role !== ROLES.SUSCRIPTORA ||
    linkedUser.accountStatus !== 'active' ||
    !linkedUser.emailVerified
  ) {
    return false;
  }

  Object.assign(user, {
    id: linkedUser.id,
    email: linkedUser.email,
    role: linkedUser.role,
    emailVerified: linkedUser.emailVerified,
    securityVersion: linkedUser.securityVersion,
  });
  return true;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

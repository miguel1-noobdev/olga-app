import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import { authorizeWithRepository } from './authorize-credentials';
import { getGoogleOAuthConfig, isVerifiedGoogleProfile, normalizeGoogleEmail } from './google';
import { provisionGoogleAccount } from './google-provisioning';

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

      const outcome = await provisionGoogleAccount({
        providerAccountId: account.providerAccountId,
        email: normalizeGoogleEmail(profile.email),
        repository: createUserRepository(),
      });
      if (outcome.kind === 'account_in_use') {
        return '/login?error=AccountInUse';
      }
      if (outcome.kind === 'denied') return false;

      Object.assign(user, {
        id: outcome.user.id,
        email: outcome.user.email,
        role: outcome.user.role,
        emailVerified: outcome.user.emailVerified,
        securityVersion: outcome.user.securityVersion,
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

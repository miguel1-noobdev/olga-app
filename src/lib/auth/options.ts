import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import { authorizeWithRepository } from './authorize-credentials';

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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn() {
      await connectToDatabase();
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

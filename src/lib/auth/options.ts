import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createUserRepository } from '@/lib/db/repository/user';
import { connectToDatabase } from '@/lib/db/connect';
import { ROLES } from './roles';
import { authorizeWithRepository } from './authorize-credentials';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      await connectToDatabase();

      if (account?.provider === 'google') {
        const repo = createUserRepository();
        const existingUser = await repo.findByEmail(user.email!);

        if (!existingUser) {
          // OAuth sign-ins must never infer bootstrap privileges from an empty
          // database. All new OAuth users are created as suscriptora; admin or
          // productora roles must be assigned explicitly via scripts or admin
          // tooling after the account exists.
          await repo.create({
            email: user.email!,
            password: crypto.randomUUID(),
            role: ROLES.SUSCRIPTORA,
          });
        }
      }

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
          }
        } else {
          token.id = user.id;
          token.role = user.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
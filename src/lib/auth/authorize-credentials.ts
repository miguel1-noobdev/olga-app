import type { UserRepository } from '@/lib/db/repository/user';

export interface CredentialsInput {
  email: string;
  password: string;
}

export async function authorizeWithRepository(
  repo: UserRepository,
  credentials: CredentialsInput | undefined
) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await repo.findByEmail(credentials.email);

  if (!user) {
    return null;
  }

  const isValid = await repo.verifyPassword(user, credentials.password);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

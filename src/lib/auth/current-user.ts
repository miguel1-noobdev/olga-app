import { getServerSession } from 'next-auth';
import { authOptions } from './options';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  await connectToDatabase();
  const user = await createUserRepository().findById(session.user.id);

  if (!user || user.accountStatus !== 'active' || user.emailVerified === false) {
    return null;
  }

  if (
    typeof session.user.securityVersion === 'number' &&
    session.user.securityVersion !== user.securityVersion
  ) {
    return null;
  }

  return user;
}

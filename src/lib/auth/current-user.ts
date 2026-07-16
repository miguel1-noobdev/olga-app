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

  return user?.accountStatus === 'active' ? user : null;
}

import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { isAdmin } from '@/lib/auth/roles';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!isAdmin(session.user.role)) {
    redirect('/');
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isAdmin } from '@/lib/auth/roles';
import AdminShell from '@/components/admin/admin-shell';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!isAdmin(user.role)) {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function JardinDigitalLayout({ children }: { children: ReactNode }) {
  if (!await getCurrentUser()) {
    redirect('/login');
  }

  return children;
}

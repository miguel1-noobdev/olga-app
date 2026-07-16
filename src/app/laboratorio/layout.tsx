import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isStaff } from '@/lib/auth/roles';
import LaboratoryNavbar from '@/components/laboratorio/laboratory-navbar';

interface LaboratoryLayoutProps {
  children: ReactNode;
}

export default async function LaboratoryLayout({ children }: LaboratoryLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!isStaff(user.role)) {
    redirect('/');
  }

  return (
    <>
      <LaboratoryNavbar />
      {children}
    </>
  );
}

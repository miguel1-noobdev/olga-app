import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { isStaff } from '@/lib/auth/roles';
import LaboratoryNavbar from '@/components/laboratorio/laboratory-navbar';

interface LaboratoryLayoutProps {
  children: ReactNode;
}

export default async function LaboratoryLayout({ children }: LaboratoryLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!isStaff(session.user.role)) {
    redirect('/');
  }

  return (
    <>
      <LaboratoryNavbar />
      {children}
    </>
  );
}

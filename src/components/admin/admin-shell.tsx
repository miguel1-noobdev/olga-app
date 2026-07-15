import type { ReactNode } from 'react';
import AdminHeader from './admin-header';
import AdminSidebar from './admin-sidebar';

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface md:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        {children}
      </div>
    </div>
  );
}

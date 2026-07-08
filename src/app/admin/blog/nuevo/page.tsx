import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import AdminNavbar from '@/components/admin/admin-navbar';
import ArticleForm from '@/components/admin/article-form';

export default async function NuevoArticuloPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <>
      <AdminNavbar />
      <ArticleForm />
    </>
  );
}

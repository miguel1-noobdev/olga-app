import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/admin/admin-navbar';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen bg-surface pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl text-on-surface mb-8">
            Panel de Administración
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/blog"
              className="bg-white/50 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 hover:bg-white/70 transition-all"
            >
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Artículos del Blog
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Crear, editar y gestionar artículos
              </p>
            </Link>

            <Link
              href="/admin/blog/nuevo"
              className="bg-primary/10 backdrop-blur-[10px] border border-primary/20 rounded-xl p-8 hover:bg-primary/20 transition-all"
            >
              <h2 className="font-serif text-2xl text-primary mb-2">
                Nuevo Artículo
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Crear un nuevo artículo para el blog
              </p>
            </Link>

            <div className="bg-white/30 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 opacity-50">
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Productos
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Próximamente
              </p>
            </div>

            <div className="bg-white/30 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 opacity-50">
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Laboratorio
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Próximamente
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

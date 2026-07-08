import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createArticleRepository } from '@/lib/db/repository/article';
import { connectToDatabase } from '@/lib/db/connect';
import AdminNavbar from '@/components/admin/admin-navbar';

export default async function AdminBlogPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  await connectToDatabase();
  const repo = createArticleRepository();
  const articles = await repo.findAllPublished();

  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen bg-surface pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-on-surface mb-2">
              Panel de Artículos
            </h1>
            <p className="font-sans text-lg text-on-surface-variant">
              Gestioná los artículos del blog
            </p>
          </div>
          <Link
            href="/admin/blog/nuevo"
            className="px-6 py-3 bg-primary text-white rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
          >
            Nuevo Artículo
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-[10px] border border-white/20 rounded-xl p-12 text-center">
            <p className="font-sans text-lg text-on-surface-variant mb-4">
              No hay artículos publicados aún
            </p>
            <Link
              href="/admin/blog/nuevo"
              className="inline-block px-6 py-3 bg-primary text-white rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Crear primer artículo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white/50 backdrop-blur-[10px] border border-white/20 rounded-xl p-6 flex justify-between items-center"
              >
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-on-surface mb-1">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                    <span>{article.category}</span>
                    <span>•</span>
                    <span>{article.readingTime}</span>
                    <span>•</span>
                    <span>
                      {new Date(article.publishedAt!).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  );
}

import Link from 'next/link';
import ContentActions from '@/components/admin/content-actions';
import { getArticleLifecycleState } from '@/lib/admin/content/lifecycle';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';

const labels = { draft: 'Borrador', reviewed: 'Revisado', published: 'Publicado', unpublished: 'Despublicado' };

export default async function AdminContentPage() {
  await connectToDatabase();
  const articles = await createArticleRepository().findAll();

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-on-surface">Contenido</h1>
            <p className="font-sans text-lg text-on-surface-variant">Revisá y publicá artículos privados.</p>
          </div>
          <Link href="/admin/contenido/nuevo" className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">
            Nuevo artículo
          </Link>
        </div>
        <div className="space-y-4">
          {articles.map((article) => {
            const state = getArticleLifecycleState({
              published: article.published,
              reviewedAt: article.reviewedAt ? new Date(article.reviewedAt) : null,
              unpublishedAt: article.unpublishedAt ? new Date(article.unpublishedAt) : null,
            });
            return (
              <article key={article.id} className="rounded-xl border border-white/20 bg-white/50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl text-on-surface">{article.title}</h2>
                    <p className="text-sm text-on-surface-variant">{labels[state]} · {article.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/admin/contenido/${article.id}/previsualizar`} className="text-sm font-semibold text-primary">
                      Previsualizar
                    </Link>
                    <ContentActions id={article.id} state={state} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

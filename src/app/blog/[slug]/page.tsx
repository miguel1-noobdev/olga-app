import BlogNavbar from '@/components/blog/blog-navbar';
import BlogFooter from '@/components/blog/blog-footer';
import ArticleBody from '@/components/blog/article-body';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';
import { notFound } from 'next/navigation';
import ResilientImage from '@/components/ui/resilient-image';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  await connectToDatabase();
  const repo = createArticleRepository();
  const article = await repo.findPublishedBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <BlogNavbar />
      <main className="min-h-screen bg-surface pt-20">
        {/* Imagen de cabecera */}
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden bg-white">
          <ResilientImage
            src={article.image}
            alt={article.imageAlt}
            className={`w-full h-full ${
              article.image.includes('logo') ? 'object-contain' : 'object-cover'
            }`}
          />
        </div>

        {/* Contenido del artículo */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Metadata */}
          <div className="mb-8">
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
              {article.category}
            </span>
          </div>

          {/* Título */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-on-surface leading-tight mb-8">
            {article.title}
          </h1>

          {/* Fecha y tiempo de lectura */}
          <div className="flex items-center gap-6 mb-12 pb-8 border-b border-on-surface-variant/20">
            <span className="font-sans text-sm text-on-surface-variant">
              {new Date(article.publishedAt!).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="font-sans text-sm text-on-surface-variant">
              {article.readingTime}
            </span>
          </div>

          {/* Contenido */}
          <ArticleBody content={article.content} />

          {/* Botón volver */}
          <div className="mt-16 pt-8 border-t border-on-surface-variant/20">
            <Link
              href="/blog/articulos"
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver a artículos
            </Link>
          </div>
        </article>
      </main>
      <BlogFooter />
    </>
  );
}

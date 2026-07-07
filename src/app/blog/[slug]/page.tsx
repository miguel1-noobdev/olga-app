import BlogNavbar from '@/components/blog/blog-navbar';
import BlogFooter from '@/components/blog/blog-footer';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';
import { notFound } from 'next/navigation';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  await connectToDatabase();
  const repo = createArticleRepository();
  const article = await repo.findBySlug(params.slug);

  if (!article) {
    notFound();
  }

  // Parsear contenido (soporta **negritas**, ### subtítulos, - listas)
  const contentBlocks = article.content
    .split('\n\n')
    .map((block) => {
      if (block.startsWith('### ')) {
        return { type: 'heading', text: block.replace('### ', '') };
      }
      if (block.startsWith('- ')) {
        return {
          type: 'list',
          items: block.split('\n').map((line) => line.replace('- ', '')),
        };
      }
      return { type: 'paragraph', text: block };
    });

  return (
    <>
      <BlogNavbar />
      <main className="min-h-screen bg-surface pt-20">
        {/* Imagen de cabecera */}
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-[#e9f0e7] via-[#d5e0d3] to-[#c5d3c2]">
          <img
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
          <div className="font-sans text-lg text-on-surface/90 leading-relaxed space-y-6">
            {contentBlocks.map((block, index) => {
              if (block.type === 'heading') {
                return (
                  <h2
                    key={index}
                    className="font-serif text-2xl md:text-3xl text-on-surface mt-12 mb-4"
                  >
                    {block.text}
                  </h2>
                );
              }

              if (block.type === 'list') {
                return (
                  <ul
                    key={index}
                    className="list-disc pl-6 space-y-2 my-6"
                  >
                    {block.items?.map((item, i) => (
                      <li key={i} className="text-on-surface/90">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p
                  key={index}
                  className="text-on-surface/90"
                  dangerouslySetInnerHTML={{
                    __html: (block.text || '').replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-on-surface font-semibold">$1</strong>'
                    ),
                  }}
                />
              );
            })}
          </div>

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

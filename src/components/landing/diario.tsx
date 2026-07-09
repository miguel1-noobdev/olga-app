import React from 'react';
import Link from 'next/link';

import type { ArticleRecord } from '@/lib/db/repository/article';

type DiarioProps = {
  articles: ArticleRecord[];
};

const CATEGORY_STYLES = [
  { categoryColor: 'text-primary', hoverColor: 'group-hover:text-primary' },
  { categoryColor: 'text-secondary', hoverColor: 'group-hover:text-secondary' },
  { categoryColor: 'text-on-surface-variant', hoverColor: 'group-hover:text-on-surface-variant' },
] as const;

function formatArticleDate(article: ArticleRecord): string {
  const sourceDate = article.publishedAt ?? article.createdAt;
  return new Date(sourceDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Diario({ articles }: DiarioProps) {
  return (
    <section
      id="diario"
      className="bg-[#A8B89C]/50 min-h-[750px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 border-y border-secondary"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
              Diario Botánico
            </h2>
            <p className="font-sans text-lg text-on-surface-variant">
              Mis reflexiones sobre ingredientes naturales, rutinas conscientes y
              el arte de la formulación artesanal.
            </p>
          </div>
          <a
            href="/blog"
            className="border-2 border-primary text-primary font-sans text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary hover:text-surface transition-all duration-300 shrink-0"
          >
            LEER MÁS
          </a>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => {
            const styles = CATEGORY_STYLES[index % CATEGORY_STYLES.length];

            return (
              <article
                key={article.id}
                className="group cursor-pointer block"
              >
                <Link
                  href={`/blog/${article.slug}`}
                  className="block"
                >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 border border-secondary bg-white">
                  <div
                    className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105 ${
                      article.image.includes('logo')
                        ? 'bg-contain bg-center bg-no-repeat'
                        : 'bg-cover bg-center'
                    }`}
                    style={{ backgroundImage: `url('${article.image}')` }}
                  />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-3">
                  <span
                    className={`font-sans text-xs font-bold uppercase tracking-widest ${styles.categoryColor}`}
                  >
                    {article.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-secondary" />
                  <span className="font-sans text-sm text-on-surface-variant">
                    {formatArticleDate(article)}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`font-serif text-2xl text-primary mb-3 ${styles.hoverColor} transition-colors`}
                >
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="font-sans text-lg text-on-surface-variant line-clamp-2">
                  {article.excerpt}
                </p>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

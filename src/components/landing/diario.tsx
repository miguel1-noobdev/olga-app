import React from 'react';
import Link from 'next/link';

import type { ArticleRecord } from '@/lib/db/repository/article';

type DiarioProps = {
  articles: ArticleRecord[];
};

const CATEGORY_STYLES = [
  { categoryColor: 'text-primary', hoverColor: 'group-hover:text-primary' },
  { categoryColor: 'text-coffee', hoverColor: 'group-hover:text-coffee' },
  { categoryColor: 'text-earth', hoverColor: 'group-hover:text-earth' },
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
      className="bg-[#A8B89C]/50 py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-y border-gold-soft"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
              Diario Botánico
            </h2>
            <p className="font-sans text-lg text-on-surface-variant">
              Reflexiones sobre ingredientes naturales, rutinas conscientes y
              el arte de la formulación artesanal.
            </p>
          </div>
          <a
            href="/blog"
            className="border-2 border-primary text-primary font-sans text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 shrink-0"
          >
            LEER MÁS
          </a>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => {
            const styles = CATEGORY_STYLES[index % CATEGORY_STYLES.length];

            return (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group cursor-pointer block"
              >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 border border-gold-soft">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
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
                  <span className="w-1 h-1 rounded-full bg-gold-soft" />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Diario from '@/components/landing/diario';
import type { ArticleRecord } from '@/lib/db/repository/article';

const articles: ArticleRecord[] = [
  {
    id: 'article-1',
    title: 'El poder regenerativo de la Caléndula',
    slug: 'el-poder-regenerativo-de-la-calendula',
    excerpt: 'Descubre por qué esta flor dorada es el pilar de nuestras fórmulas calmantes.',
    content: 'content',
    category: 'Ingredientes',
    image: '/img/calendula.jpg',
    imageAlt: 'Caléndula floreciendo en el jardín',
    readingTime: '4 min',
    published: true,
    publishedAt: '2026-05-15T10:00:00.000Z',
    createdAt: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'article-2',
    title: 'Transición de temporada: Cuidados de Verano',
    slug: 'transicion-de-temporada-cuidados-de-verano',
    excerpt: 'A medida que el aire se enfría, tu piel necesita lípidos más ricos.',
    content: 'content',
    category: 'Rutinas',
    image: '/img/verano.jpg',
    imageAlt: 'Mesa con ritual de cuidado para el verano',
    readingTime: '5 min',
    published: true,
    publishedAt: '2026-06-10T10:00:00.000Z',
    createdAt: '2026-06-10T09:00:00.000Z',
  },
  {
    id: 'article-3',
    title: 'Leyendo etiquetas: Qué evitar en cosmética',
    slug: 'leyendo-etiquetas-que-evitar-en-cosmetica',
    excerpt: 'Una guía práctica para entender los INCI y tomar decisiones más conscientes.',
    content: 'content',
    category: 'Transparencia',
    image: '/img/etiquetas.jpg',
    imageAlt: 'Etiqueta de cosmética artesanal',
    readingTime: '6 min',
    published: true,
    publishedAt: '2026-04-20T10:00:00.000Z',
    createdAt: '2026-04-20T09:00:00.000Z',
  },
];

describe('Diario landing section', () => {
  it('renders the supplied articles instead of hardcoded placeholders', () => {
    const html = renderToStaticMarkup(<Diario articles={articles} />);

    expect((html.match(/<article/g) ?? []).length).toBe(3);
    expect(html).toContain(articles[0].title);
    expect(html).toContain(articles[1].title);
    expect(html).toContain(articles[2].title);
    expect(html).toContain(articles[0].image);
    expect(html).toContain('href="/blog"');
  });
});

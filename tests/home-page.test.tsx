import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArticleRecord } from '@/lib/db/repository/article';

const { connectToDatabaseMock, findLatestPublishedMock, diarioMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findLatestPublishedMock: vi.fn(),
  diarioMock: vi.fn(({ articles }: { articles: ArticleRecord[] }) => (
    <section data-testid="diario">
      {articles.map((article) => (
        <span key={article.id}>{article.title}</span>
      ))}
    </section>
  )),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: () => ({
    findLatestPublished: findLatestPublishedMock,
  }),
}));

vi.mock('@/components/landing/navbar', () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock('@/components/landing/hero', () => ({
  default: () => <div data-testid="hero" />,
}));

vi.mock('@/components/landing/products', () => ({
  default: () => <div data-testid="products" />,
}));

vi.mock('@/components/landing/metodos', () => ({
  default: () => <div data-testid="metodos" />,
}));

vi.mock('@/components/landing/diario', () => ({
  default: diarioMock,
}));

vi.mock('@/components/landing/glosario', () => ({
  default: () => <div data-testid="glosario" />,
}));

vi.mock('@/components/landing/olga', () => ({
  default: () => <div data-testid="olga" />,
}));

vi.mock('@/components/landing/unete', () => ({
  default: () => <div data-testid="unete" />,
}));

vi.mock('@/components/landing/redes', () => ({
  default: () => <div data-testid="redes" />,
}));

vi.mock('@/components/landing/footer', () => ({
  default: () => <div data-testid="footer" />,
}));

import HomePage from '@/app/page';

const latestArticles: ArticleRecord[] = [
  {
    id: 'article-1',
    title: 'Primera nota',
    slug: 'primera-nota',
    excerpt: 'Excerpt 1',
    content: 'content',
    category: 'Categoria 1',
    image: '/img/1.jpg',
    imageAlt: 'Image 1',
    readingTime: '3 min',
    published: true,
    publishedAt: '2026-07-01T10:00:00.000Z',
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'article-2',
    title: 'Segunda nota',
    slug: 'segunda-nota',
    excerpt: 'Excerpt 2',
    content: 'content',
    category: 'Categoria 2',
    image: '/img/2.jpg',
    imageAlt: 'Image 2',
    readingTime: '4 min',
    published: true,
    publishedAt: '2026-06-20T10:00:00.000Z',
    createdAt: '2026-06-20T09:00:00.000Z',
  },
  {
    id: 'article-3',
    title: 'Tercera nota',
    slug: 'tercera-nota',
    excerpt: 'Excerpt 3',
    content: 'content',
    category: 'Categoria 3',
    image: '/img/3.jpg',
    imageAlt: 'Image 3',
    readingTime: '5 min',
    published: true,
    publishedAt: '2026-06-10T10:00:00.000Z',
    createdAt: '2026-06-10T09:00:00.000Z',
  },
];

const landingSectionTestIds = [
  'hero',
  'products',
  'metodos',
  'diario',
  'glosario',
  'olga',
  'unete',
  'redes',
  'footer',
] as const;

function expectLandingToRender(html: string) {
  expect(html).toContain('data-testid="navbar"');

  for (const testId of landingSectionTestIds) {
    expect(html).toContain(`data-testid="${testId}"`);
  }
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the latest three published articles and forwards them to Diario', async () => {
    findLatestPublishedMock.mockResolvedValueOnce(latestArticles);

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findLatestPublishedMock).toHaveBeenCalledWith(3);
    expect(diarioMock).toHaveBeenCalledTimes(1);
    expect(diarioMock.mock.calls[0][0].articles).toEqual(latestArticles);
    expect(html).toContain('data-testid="diario"');
    expect(html).toContain('Primera nota');
    expect(html).toContain('Segunda nota');
    expect(html).toContain('Tercera nota');
  });

  it('keeps the complete landing when the database connection fails', async () => {
    const databaseError = new Error('raw database connection details');
    connectToDatabaseMock.mockRejectedValueOnce(databaseError);

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findLatestPublishedMock).not.toHaveBeenCalled();
    expectLandingToRender(html);
    expect(diarioMock).toHaveBeenCalledTimes(1);
    expect(diarioMock.mock.calls[0][0].articles).toEqual([]);
    expect(html).not.toContain(databaseError.message);
  });

  it('keeps the complete landing when the article preview fails', async () => {
    const articleError = new Error('raw article repository details');
    findLatestPublishedMock.mockRejectedValueOnce(articleError);

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findLatestPublishedMock).toHaveBeenCalledWith(3);
    expectLandingToRender(html);
    expect(diarioMock).toHaveBeenCalledTimes(1);
    expect(diarioMock.mock.calls[0][0].articles).toEqual([]);
    expect(html).not.toContain(articleError.message);
  });
});

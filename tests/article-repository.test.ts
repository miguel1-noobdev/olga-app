import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createArticleRepository } from '@/lib/db/repository/article';
import { ArticleModel } from '@/lib/db/models/article';

describe('ArticleRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repo: ReturnType<typeof createArticleRepository>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await ArticleModel.syncIndexes();
    repo = createArticleRepository();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  function articleInput() {
    return {
      title: 'Ritual de lavanda',
      slug: '',
      excerpt: 'Un ritual relajante con lavanda',
      content: 'Contenido del artículo sobre lavanda.',
      category: 'Rituales',
      image: 'https://example.com/lavanda.jpg',
      imageAlt: 'Ramo de lavanda',
      readingTime: '3 min de lectura',
    };
  }

  describe('create', () => {
    it('publishes the article immediately', async () => {
      const article = await repo.create(articleInput());

      expect(article.published).toBe(true);
      expect(article.publishedAt).not.toBeNull();
    });

    it('generates a slug from the title when none is provided', async () => {
      const article = await repo.create(articleInput());

      expect(article.slug).toBe('ritual-de-lavanda');
    });

    it('preserves a provided slug', async () => {
      const article = await repo.create({ ...articleInput(), slug: 'lavanda-ritual' });

      expect(article.slug).toBe('lavanda-ritual');
    });
  });

  describe('findPublishedBySlug', () => {
    it('returns a published article by slug', async () => {
      const created = await repo.create(articleInput());

      const found = await repo.findPublishedBySlug(created.slug);

      expect(found).not.toBeNull();
      expect(found?.title).toBe('Ritual de lavanda');
    });

    it('returns null when the article is not published', async () => {
      const created = await repo.create(articleInput());
      await repo.unpublish(created.id);

      const found = await repo.findPublishedBySlug(created.slug);

      expect(found).toBeNull();
    });

    it('returns null when no article matches the slug', async () => {
      const found = await repo.findPublishedBySlug('no-existe');

      expect(found).toBeNull();
    });

    it('is case-insensitive and trims whitespace', async () => {
      const created = await repo.create(articleInput());

      const found = await repo.findPublishedBySlug('  Ritual-De-Lavanda  ');

      expect(found).not.toBeNull();
      expect(found?.slug).toBe('ritual-de-lavanda');
    });
  });

  describe('findAllPublished', () => {
    it('returns only published articles sorted by publishedAt desc', async () => {
      const first = await repo.create({ ...articleInput(), title: 'Primero' });
      const second = await repo.create({ ...articleInput(), title: 'Segundo' });
      await repo.unpublish(first.id);

      const all = await repo.findAllPublished();

      expect(all).toHaveLength(1);
      expect(all[0].title).toBe('Segundo');
    });

    it('returns empty array when no published articles exist', async () => {
      const created = await repo.create(articleInput());
      await repo.unpublish(created.id);

      const all = await repo.findAllPublished();

      expect(all).toEqual([]);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { ARTICLE_SEEDS, seedArticles } from '../scripts/seed-articles';

describe('article seed lifecycle', () => {
  it('creates, reviews, and publishes new articles; remediates drafts; and preserves published records', async () => {
    const canonicalDraft = {
      id: 'draft-id',
      slug: ARTICLE_SEEDS[0].slug,
      published: false,
    };
    const canonicalPublished = {
      id: 'published-id',
      slug: ARTICLE_SEEDS[2].slug,
      published: true,
    };
    const created = {
      id: 'created-id',
      slug: ARTICLE_SEEDS[1].slug,
      published: false,
    };
    const findBySlug = vi
      .fn()
      .mockResolvedValueOnce(canonicalDraft)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(canonicalPublished);
    const create = vi.fn().mockResolvedValue(created);
    const review = vi.fn().mockResolvedValue({ ...created, reviewedAt: '2026-07-30T00:00:00.000Z' });
    const publish = vi.fn().mockResolvedValue(undefined);

    await seedArticles({ findBySlug, create, review, publish });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(ARTICLE_SEEDS[1]);
    expect(review).toHaveBeenCalledTimes(2);
    expect(review).toHaveBeenNthCalledWith(1, canonicalDraft.id);
    expect(review).toHaveBeenNthCalledWith(2, created.id);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, canonicalDraft.id);
    expect(publish).toHaveBeenNthCalledWith(2, created.id);
  });
});

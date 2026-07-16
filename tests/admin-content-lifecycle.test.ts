import { describe, expect, it } from 'vitest';
import {
  canPublishArticle,
  getArticleLifecycleState,
  reviewArticle,
  unpublishArticle,
} from '@/lib/admin/content/lifecycle';

describe('Admin content lifecycle', () => {
  it('keeps intake as a private draft until Admin reviews it', () => {
    expect(getArticleLifecycleState({ published: false, reviewedAt: null, unpublishedAt: null })).toBe('draft');
    expect(canPublishArticle({ published: false, reviewedAt: null, unpublishedAt: null })).toBe(false);
  });

  it('allows a reviewed draft to publish and returns it to a private state when unpublished', () => {
    const reviewed = reviewArticle({ published: false, reviewedAt: null, unpublishedAt: null });

    expect(reviewed).toEqual({ reviewedAt: expect.any(Date), unpublishedAt: null });
    expect(canPublishArticle({ published: false, reviewedAt: reviewed.reviewedAt, unpublishedAt: null })).toBe(true);
    expect(getArticleLifecycleState({ published: true, reviewedAt: reviewed.reviewedAt, unpublishedAt: null })).toBe('published');

    const unpublished = unpublishArticle({
      published: true,
      reviewedAt: reviewed.reviewedAt,
      unpublishedAt: null,
    });

    expect(unpublished).toEqual({ published: false, publishedAt: null, unpublishedAt: expect.any(Date) });
    expect(getArticleLifecycleState({ ...unpublished, reviewedAt: reviewed.reviewedAt })).toBe('unpublished');
  });

  it('unpublishes a legacy published article without a review timestamp', () => {
    const unpublished = unpublishArticle({
      published: true,
      reviewedAt: null,
      unpublishedAt: null,
    });

    expect(unpublished).toEqual({ published: false, publishedAt: null, unpublishedAt: expect.any(Date) });
    expect(getArticleLifecycleState({ ...unpublished, reviewedAt: null })).toBe('unpublished');
  });

  it('blocks publishing an article that was previously unpublished until it is reviewed again', () => {
    const previouslyUnpublished = {
      published: false,
      reviewedAt: new Date('2026-07-15T00:00:00.000Z'),
      unpublishedAt: new Date('2026-07-16T00:00:00.000Z'),
    };

    expect(canPublishArticle(previouslyUnpublished)).toBe(false);
    expect(getArticleLifecycleState(previouslyUnpublished)).toBe('unpublished');

    const reReviewed = reviewArticle(previouslyUnpublished);

    expect(reReviewed.unpublishedAt).toBeNull();
    expect(canPublishArticle({ published: false, reviewedAt: reReviewed.reviewedAt, unpublishedAt: reReviewed.unpublishedAt })).toBe(true);
  });
});

export interface ArticleLifecycleInput {
  published: boolean;
  reviewedAt: Date | null;
  unpublishedAt: Date | null;
}

export type ArticleLifecycleState = 'draft' | 'reviewed' | 'published' | 'unpublished';

export function getArticleLifecycleState({
  published,
  reviewedAt,
  unpublishedAt,
}: ArticleLifecycleInput): ArticleLifecycleState {
  if (published) {
    return 'published';
  }

  if (unpublishedAt) {
    return 'unpublished';
  }

  return reviewedAt ? 'reviewed' : 'draft';
}

export function reviewArticle({
  published,
}: ArticleLifecycleInput): { reviewedAt: Date; unpublishedAt: null } {
  if (published) {
    throw new Error('Published articles cannot be reviewed');
  }

  return { reviewedAt: new Date(), unpublishedAt: null };
}

export function canPublishArticle(article: ArticleLifecycleInput): boolean {
  return !article.published && article.reviewedAt !== null;
}

export function unpublishArticle({
  published,
}: ArticleLifecycleInput): { published: false; publishedAt: null; unpublishedAt: Date } {
  if (!published) {
    throw new Error('Only published articles can be unpublished');
  }

  return { published: false, publishedAt: null, unpublishedAt: new Date() };
}

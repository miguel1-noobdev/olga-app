import { describe, it, expect } from 'vitest';
import type { IndexDefinition } from 'mongoose';
import { ArticleModel } from '@/lib/db/models/article';

describe('ArticleModel', () => {
  it('defines only one slug index', () => {
    const slugIndexes = ArticleModel.schema
      .indexes()
      .filter(([fields]: [IndexDefinition]) => JSON.stringify(fields) === JSON.stringify({ slug: 1 }));

    expect(slugIndexes).toHaveLength(1);
  });
});

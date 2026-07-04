import { ArticleModel, IArticle } from '../models/article';

export interface ArticleRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  imageAlt: string;
  readingTime: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  imageAlt: string;
  readingTime: string;
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  image?: string;
  imageAlt?: string;
  readingTime?: string;
}

export interface ArticleRepository {
  create(input: CreateArticleInput): Promise<ArticleRecord>;
  findById(id: string): Promise<ArticleRecord | null>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  findLatestPublished(limit: number): Promise<ArticleRecord[]>;
  findAllPublished(): Promise<ArticleRecord[]>;
  update(id: string, input: UpdateArticleInput): Promise<ArticleRecord>;
  publish(id: string): Promise<void>;
  unpublish(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toArticleRecord(doc: IArticle): ArticleRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    content: doc.content,
    category: doc.category,
    image: doc.image,
    imageAlt: doc.imageAlt,
    readingTime: doc.readingTime,
    published: doc.published,
    publishedAt: doc.publishedAt?.toISOString() || null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function createArticleRepository(): ArticleRepository {
  return {
    async create(input: CreateArticleInput): Promise<ArticleRecord> {
      const slug = input.slug || slugify(input.title);

      const article = await ArticleModel.create({
        ...input,
        slug,
      });

      return toArticleRecord(article);
    },

    async findById(id: string): Promise<ArticleRecord | null> {
      const article = await ArticleModel.findById(id);
      return article ? toArticleRecord(article) : null;
    },

    async findBySlug(slug: string): Promise<ArticleRecord | null> {
      const article = await ArticleModel.findOne({ slug: slug.toLowerCase().trim() });
      return article ? toArticleRecord(article) : null;
    },

    async findLatestPublished(limit: number): Promise<ArticleRecord[]> {
      const articles = await ArticleModel.find({ published: true })
        .sort({ publishedAt: -1 })
        .limit(limit);

      return articles.map(toArticleRecord);
    },

    async findAllPublished(): Promise<ArticleRecord[]> {
      const articles = await ArticleModel.find({ published: true })
        .sort({ publishedAt: -1 });

      return articles.map(toArticleRecord);
    },

    async update(id: string, input: UpdateArticleInput): Promise<ArticleRecord> {
      const updateData: any = { ...input };

      if (input.title && !input.slug) {
        updateData.slug = slugify(input.title);
      }

      const article = await ArticleModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!article) {
        throw new Error('Article not found');
      }

      return toArticleRecord(article);
    },

    async publish(id: string): Promise<void> {
      const result = await ArticleModel.findByIdAndUpdate(id, {
        published: true,
        publishedAt: new Date(),
      });

      if (!result) {
        throw new Error('Article not found');
      }
    },

    async unpublish(id: string): Promise<void> {
      const result = await ArticleModel.findByIdAndUpdate(id, {
        published: false,
        publishedAt: null,
      });

      if (!result) {
        throw new Error('Article not found');
      }
    },

    async delete(id: string): Promise<void> {
      const result = await ArticleModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error('Article not found');
      }
    },
  };
}

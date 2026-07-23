import BlogNavbar from '@/components/blog/blog-navbar';
import BlogHomepage from '@/components/blog/blog-homepage';
import BlogFooter from '@/components/blog/blog-footer';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  await connectToDatabase();
  const repo = createArticleRepository();
  const latestArticles = await repo.findLatestPublished(2);

  return (
    <>
      <BlogNavbar />
      <BlogHomepage articles={latestArticles} />
      <BlogFooter />
    </>
  );
}

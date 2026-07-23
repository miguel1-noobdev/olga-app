import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';

export const dynamic = 'force-dynamic';

export default async function AdminContentPreviewPage({ params }: { params: { id: string } }) {
  await connectToDatabase();
  const article = await createArticleRepository().findById(params.id);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <article className="mx-auto max-w-3xl">
        <p className="mb-4 font-semibold text-primary">Vista previa privada</p>
        <p className="mb-3 text-sm text-on-surface-variant">{article.category}</p>
        <h1 className="mb-8 font-serif text-4xl text-on-surface">{article.title}</h1>
        <p className="whitespace-pre-wrap text-on-surface">{article.content}</p>
      </article>
    </main>
  );
}

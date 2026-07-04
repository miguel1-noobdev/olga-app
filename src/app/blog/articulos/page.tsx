import BlogNavbar from '@/components/blog/blog-navbar';
import BlogFooter from '@/components/blog/blog-footer';
import ArticleCard from '@/components/blog/article-card';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';

export default async function ArticulosPage() {
  await connectToDatabase();
  const repo = createArticleRepository();
  const articles = await repo.findAllPublished();

  return (
    <>
      <BlogNavbar />
      <main className="min-h-screen bg-surface pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero de la página de artículos */}
          <div className="mb-16 text-center">
            <h1 className="font-serif text-5xl md:text-6xl text-on-surface mb-6">
              Aprende con nuestros artículos
            </h1>
            <p className="font-sans text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
              Explorá la sabiduría de las plantas, rituales de cuidado personal y el alma detrás de cada esencia.
            </p>
          </div>

          {/* Grid de artículos */}
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-sans text-lg text-on-surface-variant">
                No hay artículos publicados aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  image={article.image}
                  imageAlt={article.imageAlt}
                  category={article.category}
                  date={new Date(article.publishedAt!).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  readingTime={article.readingTime}
                  href={`/blog/${article.slug}`}
                  variant="medium"
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BlogFooter />
    </>
  );
}

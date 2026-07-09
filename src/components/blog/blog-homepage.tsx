import ArticleCard from './article-card';
import type { ArticleRecord } from '@/lib/db/repository/article';

interface BlogHomepageProps {
  articles: ArticleRecord[];
}

const FEATURED = {
  title: 'Bienvenida al Diario Botánico',
  excerpt:
    'Un espacio dedicado a la sabiduría de las plantas, donde exploro la armonía entre la naturaleza y el cuidado personal consciente. Descubrí rituales, guías y el alma detrás de cada esencia.',
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuChh0RYStdU-lFoPgtkuct3e_QfAiF1YM9gIAJbZhwIjyHxRuN6PFPUppdcNy8aKvIMtYjj62Y10f-lm249bjLLXpLkzbaXHOTooPQbNg3PkSsscmydomKEK2UqrfZUFcs9uvTWBxaCLhF_1cApI3jMI2OMqsZDsDnzAVuioTULXQbxL_g623RGNsic7Ko5Psr2WlpfxUDHxyajAyCFV_UgsDNbtmahT1rToHB4hoFSTKlZSWkDHtgG0251YwsZFEI7dCx-haGt9Vg',
  imageAlt:
    'Hojas tropicales de monstera y helechos cubiertos de rocío matutino, con luz filtrada del dosel en tonos verde bosque.',
};

export default function BlogHomepage({ articles }: BlogHomepageProps) {
  return (
    <main className="min-h-screen bg-surface pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-32">
        {/* Hero de bienvenida */}
        <section className="relative group">
          <article className="rounded-xl overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[520px] bg-white/50 backdrop-blur-[10px] border border-white/20 shadow-lg">
            <div className="w-full lg:w-3/5 h-64 lg:h-full overflow-hidden">
              <img
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                src={FEATURED.image}
                alt={FEATURED.imageAlt}
                loading="lazy"
              />
            </div>

            <div className="w-full lg:w-2/5 p-6 lg:p-12 flex flex-col justify-center gap-6">
              <div className="space-y-3">
                <h1 className="font-serif text-3xl lg:text-4xl text-on-surface leading-tight">
                  {FEATURED.title}
                </h1>
                <p className="font-sans text-base lg:text-lg text-on-surface-variant line-clamp-3">
                  {FEATURED.excerpt}
                </p>
              </div>

              <a
                href="/blog/articulos"
                className="w-fit px-8 py-3 bg-primary text-white rounded-full font-sans text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md mt-2"
              >
                Seguir leyendo
              </a>
            </div>
          </article>
        </section>

        {/* Dos cards informativas */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden p-8 bg-white/50 backdrop-blur-[10px] border border-white/20 shadow-md">
            <h2 className="font-serif text-2xl text-on-surface mb-4">
              ¿Qué es el Diario Botánico?
            </h2>
            <p className="font-sans text-base text-on-surface-variant">
              Un espacio donde comparto el conocimiento ancestral de las plantas medicinales,
              recetas de cosmética natural y rituales de cuidado personal consciente.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden p-8 bg-white/50 backdrop-blur-[10px] border border-white/20 shadow-md">
            <h2 className="font-serif text-2xl text-on-surface mb-4">
              Mi filosofía
            </h2>
            <p className="font-sans text-base text-on-surface-variant">
              Creo en el poder de la naturaleza para transformar mi rutina diaria en un ritual
              sagrado de conexión con la tierra y mí misma.
            </p>
          </div>
        </section>

        {/* Artículos recientes */}
        {articles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl md:text-3xl text-on-surface">
                Artículos recientes
              </h3>
              <a
                href="/blog/articulos"
                className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface flex items-center gap-2 hover:text-primary transition-colors"
              >
                Ver todo <ArrowIcon className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  variant="small"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

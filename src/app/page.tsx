import React from 'react';
import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import Products from '@/components/landing/products';
import Metodos from '@/components/landing/metodos';
import Diario from '@/components/landing/diario';
import Glosario from '@/components/landing/glosario';
import Olga from '@/components/landing/olga';
import Unete from '@/components/landing/unete';
import Redes from '@/components/landing/redes';
import Footer from '@/components/landing/footer';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';
import type { ArticleRecord } from '@/lib/db/repository/article';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let articles: ArticleRecord[] = [];

  try {
    await connectToDatabase();
    const repo = createArticleRepository();
    articles = await repo.findLatestPublished(3);
  } catch {
    articles = [];
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface space-y-20">
        <div className="py-20">
          <Hero />
        </div>
        <div className="py-20">
          <Products />
        </div>
        <div className="py-20">
          <Metodos />
        </div>
        <div className="py-20">
          <Diario articles={articles} />
        </div>
        <div className="py-20">
          <Glosario />
        </div>
        <div className="py-20">
          <Olga />
        </div>
        <div className="py-20">
          <Unete />
        </div>
        <div className="py-20">
          <Redes />
        </div>
        <Footer />
      </main>
    </>
  );
}

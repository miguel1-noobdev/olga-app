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

export default async function HomePage() {
  await connectToDatabase();
  const repo = createArticleRepository();
  const articles = await repo.findLatestPublished(3);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface space-y-10">
        <Hero />
        <Products />
        <Metodos />
        <Diario articles={articles} />
        <Glosario />
        <Olga />
        <Unete />
        <Redes />
        <Footer />
      </main>
    </>
  );
}

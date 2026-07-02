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

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface">
        <Hero />
        <Products />
        <Metodos />
        <Diario />
        <Glosario />
        <Olga />
        <Unete />
        <Redes />
        <Footer />
      </main>
    </>
  );
}
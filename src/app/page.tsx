import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import Products from '@/components/landing/products';
import Metodos from '@/components/landing/metodos';
import Diario from '@/components/landing/diario';
import Glosario from '@/components/landing/glosario';
import Olga from '@/components/landing/olga';
import Unete from '@/components/landing/unete';
import Redes from '@/components/landing/redes';

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

        <footer className="py-12 px-4 border-t border-surface-border">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl font-serif text-primary mb-2">Botánica Esencial OB</h3>
            <p className="text-sm text-on-surface-variant">Footer en construcción - T-020</p>
          </div>
        </footer>
      </main>
    </>
  );
}
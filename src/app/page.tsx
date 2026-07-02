import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';
import Products from '@/components/landing/products';
import Metodos from '@/components/landing/metodos';
import Diario from '@/components/landing/diario';
import Glosario from '@/components/landing/glosario';
import Olga from '@/components/landing/olga';

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

        <section id="unete" className="py-20 px-4 bg-surface-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Únete</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-018</p>
          </div>
        </section>

        <section id="redes" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Nuestras Redes</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-019</p>
          </div>
        </section>

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
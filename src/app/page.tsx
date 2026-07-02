import Navbar from '@/components/landing/navbar';
import Hero from '@/components/landing/hero';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface">
        <Hero />

        <section id="productos" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Nuestros Productos</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-013</p>
          </div>
        </section>

        <section id="journal" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Journal</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-015</p>
          </div>
        </section>

        <section id="ingredientes" className="py-20 px-4 bg-surface-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Ingredientes</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-016</p>
          </div>
        </section>

        <section id="olga" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Sobre Olga</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-017</p>
          </div>
        </section>

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
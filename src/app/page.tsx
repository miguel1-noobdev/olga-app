import Navbar from '@/components/landing/navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface">
        {/* Placeholder sections - T-012 to T-020 will replace these */}
        <section id="hero" className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif text-primary mb-4">
              Botánica Esencial OB
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto px-4">
              Cosmética natural artesanal, hecha con amor y plantas
            </p>
          </div>
        </section>

        <section id="productos" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Nuestros Productos</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-013</p>
          </div>
        </section>

        <section id="metodos" className="py-20 px-4 bg-surface-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Nuestros Métodos</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-014</p>
          </div>
        </section>

        <section id="journal" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Journal</h2>
            <p className="text-on-surface-variant">Sección en construcción - T-015</p>
          </div>
        </section>

        <section id="glosario" className="py-20 px-4 bg-surface-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-primary mb-4">Glosario Botánico</h2>
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
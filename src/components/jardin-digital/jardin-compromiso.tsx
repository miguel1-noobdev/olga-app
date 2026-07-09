import React from 'react';

export default function JardinCompromiso() {
  return (
    <section className="py-20 px-6 md:px-16 bg-surface-container border-t border-surface-border/10">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-primary mb-6">
            Mi Compromiso
          </h2>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Más allá de un catálogo, soy artesana dedicada al estudio y la
            preservación de la riqueza herbolaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface p-8 rounded-2xl border border-surface-border/10 text-center">
            <h3 className="font-serif text-2xl text-primary mb-4">
              Investigación Científica
            </h3>
            <p className="font-sans text-on-surface-variant leading-relaxed">
              Documento cada especie con rigor, contrastando el conocimiento
              tradicional con evidencia botánica actual.
            </p>
          </div>

          <div className="bg-surface p-8 rounded-2xl border border-surface-border/10 text-center">
            <h3 className="font-serif text-2xl text-primary mb-4">
              Conservación
            </h3>
            <p className="font-sans text-on-surface-variant leading-relaxed">
              Protejo la diversidad herbolaria regional y promuevo su uso
              responsable para las próximas generaciones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Metodos() {
  const steps = [
    {
      number: '01',
      title: 'Selección Botánica',
      description:
        'Elegimos cada planta en su punto óptimo de cosecha, respetando los ciclos naturales y la biodiversidad local.',
    },
    {
      number: '02',
      title: 'Extracción en Frío',
      description:
        'Utilizamos métodos de extracción a baja temperatura para preservar la integridad molecular de cada ingrediente activo.',
    },
    {
      number: '03',
      title: 'Formulación Artesanal',
      description:
        'Cada producto se elabora en pequeños lotes, garantizando frescura, potencia y la máxima calidad en cada fórmula.',
    },
  ];

  return (
    <section id="metodos" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="order-2 md:order-1">
            <div className="relative p-8 md:p-12 bg-surface-container/50 backdrop-blur-glass rounded-2xl border border-gold-soft overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <h2 className="font-serif text-3xl md:text-4xl text-primary mb-8 italic">
                Nuestro Proceso
              </h2>
              <div className="space-y-10">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-6">
                    <span className="font-serif text-4xl text-primary/40">
                      {step.number}
                    </span>
                    <div>
                      <h4 className="font-serif text-xl text-primary mb-2">
                        {step.title}
                      </h4>
                      <p className="font-sans text-base text-on-surface-variant">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="space-y-6">
              <img
                className="w-full h-[500px] md:h-[600px] object-cover rounded-2xl shadow-xl"
                src="/img/lab/materias-primas-1.jpeg"
                alt="Selección de materias primas botánicas"
              />
              <div className="flex justify-between items-center p-6 border-l-4 border-primary bg-primary/5 rounded-r-2xl">
                <p className="font-serif italic text-lg text-primary">
                  "Respetar la planta es nuestra primera y única regla."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

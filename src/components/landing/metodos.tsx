export default function Metodos() {
  const principles = [
    {
      icon: 'eco',
      text: 'Prensado en frío para conservar todos los nutrientes.',
    },
    {
      icon: 'biotech',
      text: 'Micro-lotes controlados para garantizar frescura.',
    },
    {
      icon: 'filter_vintage',
      text: 'Ingredientes 100% biodegradables y locales.',
    },
  ];

  return (
    <section
      id="metodos"
      className="bg-surface-container/30 py-20 md:py-32 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-full object-cover"
                src="/img/lab/materias-primas-1.jpeg"
                alt="Proceso artesanal de extracción botánica"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 glass-card p-8 rounded-2xl hidden lg:block max-w-xs">
              <p className="font-serif text-2xl italic text-primary">
                "La integridad de la planta es mi prioridad absoluta."
              </p>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-secondary font-sans text-sm font-bold uppercase tracking-[0.2em] mb-4 block">
              Mi Método
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-primary mb-6">
              Proceso Artesanal y Pureza
            </h2>
            <p className="font-sans text-lg text-on-surface-variant mb-8 leading-relaxed">
              Utilizo técnicas de prensado en frío para asegurar que cada
              molécula activa llegue intacta a tu piel. Sin calor excesivo, sin
              químicos agresivos, solo la esencia más pura de la botánica local.
            </p>
            <ul className="space-y-4 mb-10">
              {principles.map((principle, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span
                    className="material-symbols-outlined text-secondary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {principle.icon}
                  </span>
                  <span className="font-sans text-base font-semibold text-on-surface">
                    {principle.text}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full font-sans text-sm font-bold uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Conocer más
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

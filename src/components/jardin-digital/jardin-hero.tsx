import React from 'react';

export default function JardinHero() {
  return (
    <section className="relative py-20 px-6 md:px-16 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {/* Contenido */}
      <div className="lg:col-span-7 space-y-6">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-sans text-xs font-bold uppercase tracking-widest rounded-full">
          Herbario Digital
        </span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary leading-tight">
          Explora nuestra colección de plantas medicinales
        </h1>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Un compendio vivo de la sabiduría botánica tradicional y científica.
          Descubre las propiedades, el origen y los usos de las especies que han
          acompañado a nuestra tradición herbal durante generaciones.
        </p>

      </div>

      {/* Imagen */}
      <div className="lg:col-span-5 relative">
        <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative z-10 border-4 border-white/30">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtItFS5QU5695OsGt3saoNC9VeljgKHd4_JVvnIasoRKgjVI1UBDYy05OPMw7mKUqcqt5OO8ghuU1P0vJcGQiYteIlwQq46FRsm1-RlYM5hyh9TPPy5nFPn5HtaXYlUnbwBj_VctnN02ieIfapk9usjRzt9S21ast8wpKLKJOUj7z0gugF0g8L4OkWM8wmkuBmHCt7IF8gMXfPuur-eIQleL9duhpsffxlhzMixBVYC9Bp2x5Jhkkz4pdgrBvRDgaWH9x_5KG7gZ0u"
            alt="Jardín botánico con plantas medicinales en luz matutina"
          />
        </div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/30 rounded-full -z-0 opacity-50 blur-xl" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full -z-0 opacity-30 blur-2xl" />
      </div>
    </section>
  );
}

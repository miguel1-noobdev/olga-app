import Link from 'next/link';

export default function Unete() {
  return (
    <section id="unete" className="min-h-[750px] flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary p-12 md:p-24 rounded-[3rem] shadow-2xl relative overflow-hidden text-center md:text-left">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -mr-48 -mt-48" />

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Content */}
            <div className="space-y-6">
              <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                Únete a nuestra
                <br />
                <span className="text-secondary">Comunidad Botánica</span>
              </h2>
              <p className="font-sans text-xl text-white/90 max-w-md">
                Recibe consejos de autocuidado, recetas naturales y acceso a
                nuestro blog y a nuestro santuario botánico.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-white/10 backdrop-blur-glass p-8 rounded-3xl border border-white/20 space-y-6">
              <p className="text-white/90 font-sans text-lg">
                Crea tu cuenta gratuita para acceder al blog y al Jardín
                Digital.
              </p>
              <Link
                href="/register"
                className="block w-full text-center bg-secondary text-primary font-bold py-4 rounded-xl shadow-lg hover:bg-white transition-all font-sans text-sm uppercase tracking-widest"
              >
                Crear cuenta
              </Link>
              <p className="text-white/60 text-sm font-sans">
                La suscripción por email llegará pronto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

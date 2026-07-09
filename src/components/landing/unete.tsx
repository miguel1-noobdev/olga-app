'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const TOAST_DURATION_MS = 4000;

export default function Unete() {
  const { status } = useSession();
  const [showToast, setShowToast] = useState(false);

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [showToast]);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      setShowToast(true);
    }
  };

  const ctaClasses =
    'block w-full text-center bg-secondary text-primary font-bold py-4 rounded-xl shadow-lg hover:bg-white transition-all font-sans text-sm uppercase tracking-widest';

  return (
    <section
      id="unete"
      className="min-h-[750px] flex flex-col justify-center px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary p-12 md:p-24 rounded-[3rem] shadow-2xl relative overflow-hidden text-center md:text-left">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -mr-48 -mt-48" />

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Content */}
            <div className="space-y-6">
              <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                Únete a mi
                <br />
                <span className="text-secondary">Comunidad Botánica</span>
              </h2>
              <p className="font-sans text-xl text-white/90 max-w-md">
                Recibís consejos de autocuidado, recetas naturales y acceso a
                mi blog y a mi santuario botánico.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-white/10 backdrop-blur-glass p-8 rounded-3xl border border-white/20 space-y-6 relative">
              <p className="text-white/90 font-sans text-lg">
                Crea tu cuenta gratuita para acceder al blog y al Jardín
                Digital.
              </p>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className={ctaClasses}
                >
                  Crear cuenta
                </button>
              ) : (
                <Link href="/register" className={ctaClasses}>
                  Crear cuenta
                </Link>
              )}

              <p className="text-white/60 text-sm font-sans">
                Pronto activo la suscripción por email.
              </p>

              {showToast && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/95 text-primary px-6 py-4 rounded-2xl shadow-2xl border border-secondary/30 text-center z-20"
                >
                  <p className="font-sans text-sm md:text-base leading-relaxed">
                    Ya formás parte de mi comunidad. Ahora a disfrutar de
                    todo el contenido de mi web.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import Link from 'next/link';

export default function JardinFooter() {
  const legalLabels = ['Privacidad', 'Términos', 'Contacto'];

  return (
    <footer className="w-full bg-gradient-to-b from-primary to-surface-container pt-20 pb-8 text-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="font-serif text-3xl italic text-white mb-4">
              Jardín Digital
            </div>
            <p className="text-white/70 text-base">
              Preservo la biodiversidad botánica para las futuras generaciones a
              través de la educación y el arte digital.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-widest mb-6 text-secondary">
              Navegación
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/jardin-digital"
                  className="text-white/70 hover:text-secondary transition-colors duration-300"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-white/70 hover:text-secondary transition-colors duration-300"
                >
                  Inicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-widest mb-6 text-secondary">
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLabels.map((label) => (
                <li key={label}>
                  <span className="text-white/70">
                    {label}{' '}
                    <span className="text-white/50">(próximamente)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-black text-sm font-bold italic">
            © 2026 Jardín Digital. Todos los derechos reservados.
          </p>
          <div className="text-center md:text-right">
            <p className="text-black text-sm font-bold">
              Creado por Miguel P.
            </p>
            <p className="text-black/70 text-xs font-bold">IA_Soluciones Web</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

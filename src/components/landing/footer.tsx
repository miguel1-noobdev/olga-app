import Link from 'next/link';
import { EnvelopeIcon, MapPinIcon } from '@/components/ui/icons';

export default function Footer() {
  const navLinks = [
    { href: '#hero', label: 'Inicio' },
    { href: '#productos', label: 'Productos' },
    { href: '/blog', label: 'Journal' },
    { href: '/jardin-digital', label: 'Jardin 2.0' },
  ];

  return (
    <footer className="w-full bg-gradient-to-b from-primary to-surface-container min-h-[400px] flex flex-col justify-center pb-8 text-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="font-serif text-3xl italic text-white mb-4">
              Botánica Esencial OB
            </div>
            <p className="text-white/70 text-base">
              Hago cosmética natural para una belleza eterna. Cada fórmula nace para la eficacia
              pura y el bienestar consciente.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-widest mb-6 text-secondary">
              Navegación
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-white/70 hover:text-secondary transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-secondary transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-widest mb-6 text-secondary">
              Contacto
            </h4>
            <ul className="space-y-3 text-white/70">
              <li className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4" />
                <span>Calle de la Pureza 45, Barcelona</span>
              </li>
              <li className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4" />
                <span>hello@botanicaob.com</span>
              </li>
              <li>
                <span className="text-white/70">
                  Store locator{' '}
                  <span className="text-white/50">(próximamente)</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-black text-sm font-bold italic">
            © 2026 Botánica Esencial OB. Todos los derechos reservados.
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

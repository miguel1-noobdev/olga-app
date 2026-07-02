export default function Footer() {
  const navLinks = [
    { href: '#hero', label: 'Inicio' },
    { href: '#productos', label: 'Productos' },
    { href: '#journal', label: 'Journal' },
    { href: '#ingredientes', label: 'Ingredientes' },
  ];

  return (
    <footer className="w-full bg-gradient-to-b from-primary to-surface-container pt-20 pb-8 text-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="font-serif text-3xl italic text-white mb-4">
              Botánica Esencial OB
            </div>
            <p className="text-white/70 text-base">
              Ciencia natural para una belleza eterna. Creado para la eficacia
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
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-secondary transition-colors duration-300"
                  >
                    {link.label}
                  </a>
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
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>Calle de la Pureza 45, Barcelona</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span>hello@botanicaob.com</span>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-secondary transition-colors duration-300"
                >
                  Store Locator
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm italic">
            © 2026 Botánica Esencial OB. Todos los derechos reservados.
          </p>
          <div className="text-center md:text-right">
            <p className="text-white/70 text-sm font-bold">
              Creado por Miguel P.
            </p>
            <p className="text-white/50 text-xs">IA_Soluciones Web</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

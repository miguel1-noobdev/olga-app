'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogNavbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll hacia abajo - ocultar navbar
        setIsVisible(false);
      } else {
        // Scroll hacia arriba - mostrar navbar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-[10px] border-b border-white/20 shadow-[0px_10px_30px_rgba(45,74,46,0.08)] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto">
        {/* Logo y título */}
        <Link href="/blog" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-serif text-xl text-primary">B</span>
          </div>
          <span className="font-serif text-xl text-on-surface">
            Botánica Esencial OB
          </span>
        </Link>

        {/* Navegación */}
        <div className="flex items-center gap-6">
          <Link
            href="/blog"
            className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/blog/articulos"
            className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/"
            className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            Salir
          </Link>
        </div>
      </div>
    </nav>
  );
}

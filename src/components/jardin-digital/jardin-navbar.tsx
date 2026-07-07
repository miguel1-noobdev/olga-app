'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JardinNavbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      data-testid="jardin-navbar"
      className={`fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_4px_20px_rgba(26,47,35,0.04)] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex justify-between items-center h-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
        {/* Logo y título */}
        <Link href="/jardin-digital" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-serif text-xl text-primary">J</span>
          </div>
          <span className="font-serif text-2xl text-primary hidden sm:inline">
            Jardín Digital
          </span>
        </Link>

        {/* Navegación */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/jardin-digital"
            className="font-sans text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg
                       bg-primary text-surface
                       shadow-[0_4px_0_#1a5c2a,0_6px_12px_rgba(26,47,35,0.2)]
                       hover:-translate-y-0.5 hover:shadow-[0_5px_0_#1a5c2a,0_8px_16px_rgba(26,47,35,0.25)]
                       active:translate-y-1 active:shadow-[0_2px_0_#1a5c2a,0_3px_6px_rgba(26,47,35,0.2)]
                       transition-all duration-100"
          >
            Catálogo
          </Link>
          <Link
            href="/"
            className="font-sans text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg
                       bg-surface-container text-on-surface
                       shadow-[0_4px_0_#c7d6c4,0_6px_12px_rgba(26,47,35,0.1)]
                       hover:-translate-y-0.5 hover:shadow-[0_5px_0_#c7d6c4,0_8px_16px_rgba(26,47,35,0.15)]
                       active:translate-y-1 active:shadow-[0_2px_0_#c7d6c4,0_3px_6px_rgba(26,47,35,0.1)]
                       transition-all duration-100"
          >
            Inicio
          </Link>
        </div>

        {/* Botón de búsqueda (placeholder) */}
        <div className="flex items-center gap-4">
          <button className="hidden lg:flex items-center bg-surface-container px-4 py-2 rounded-full border border-surface-border/30">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">
              search
            </span>
            <span className="font-sans text-sm text-on-surface-variant">
              Buscar...
            </span>
          </button>
          <button className="md:hidden">
            <span className="material-symbols-outlined text-primary text-3xl">
              menu
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

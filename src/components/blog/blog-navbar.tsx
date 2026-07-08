'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function BlogNavbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { data: session, status } = useSession();

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

  const isAuthenticated = status === 'authenticated';
  const userDisplay = session?.user?.name || session?.user?.email || 'Usuario';

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-[10px] border-b border-white/20 shadow-[0px_10px_30px_rgba(45,74,46,0.08)] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center min-h-[5rem] h-auto sm:h-20 px-4 sm:px-6 py-3 sm:py-0 max-w-7xl mx-auto gap-3 sm:gap-0">
        {/* Logo y título - izquierda en desktop, arriba en mobile */}
        <div className="sm:flex-1 sm:basis-0 flex justify-center sm:justify-start w-full sm:w-auto">
          <Link href="/blog" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-serif text-xl text-primary">B</span>
            </div>
            <span className="font-serif text-xl text-on-surface">
              Botánica Esencial OB
            </span>
          </Link>
        </div>

        {/* Navegación principal - centro */}
        <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap sm:flex-1 sm:basis-0">
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
          {isAuthenticated && (
            <span className="font-sans text-sm text-on-surface-variant truncate max-w-[120px] sm:max-w-[160px]">
              {userDisplay}
            </span>
          )}
        </div>

        {/* Acceso a landing - derecha en desktop, abajo en mobile */}
        <div className="sm:flex-1 sm:basis-0 flex justify-center sm:justify-end w-full sm:w-auto sm:pl-6 md:pl-10">
          {isAuthenticated && (
            <Link
              href="/"
              className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
            >
              Esenciales OB
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

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
          {isAuthenticated && (
            <>
              <span className="font-sans text-sm text-on-surface-variant">
                {userDisplay}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

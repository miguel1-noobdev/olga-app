'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { isProductora, isAdmin } from '@/lib/auth/roles';

const NAV_LINKS = [
  { href: '#hero', label: 'Inicio' },
  { href: '#productos', label: 'Productos' },
  { href: '/blog', label: 'Journal' },
  { href: '/jardin-digital', label: 'Jardin 2.0' },
];

const SCROLL_THRESHOLD = 50;

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthenticated = status === 'authenticated';
  const userImage = session?.user?.image;
  const userName = session?.user?.name || session?.user?.email || 'Usuario';
  const userRole = session?.user?.role ?? '';

  const privateNavItem = (() => {
    if (isProductora(userRole)) {
      return { label: 'Laboratorio', href: '/laboratorio' };
    }
    if (isAdmin(userRole)) {
      return { label: 'Admin', href: '/admin' };
    }
    return null;
  })();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[#e9f0e7]/50 backdrop-blur-glass border-b border-white/40 shadow-sm transition-all duration-300 ${
        scrolled ? 'h-16' : 'h-32'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo + site name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div
              className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                scrolled ? 'w-0 h-0 opacity-0 scale-0' : 'w-[120px] h-[120px] opacity-100 scale-100'
              }`}
            >
              <Image
                src="/img/logo/logotrans3-256.png?v=4"
                alt="Botánica Esencial OB"
                fill
                className="object-contain transition-transform duration-700 group-hover:rotate-[360deg] group-hover:scale-110"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-serif text-primary font-bold whitespace-nowrap">
              Botánica Esencial OB
            </span>
          </Link>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-lg text-on-surface hover:text-primary rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-lg text-on-surface hover:text-primary rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              )
            ))}
            {privateNavItem && (
              <Link
                href={privateNavItem.href}
                className="px-3 py-2 text-lg text-primary hover:text-primary/80 rounded-md transition-colors"
              >
                {privateNavItem.label}
              </Link>
            )}
          </div>

          {/* Right: Auth Buttons / User */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  {userImage ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-surface-border">
                      <Image
                        src={userImage}
                        alt={userName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-surface flex items-center justify-center text-xs font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-lg text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/register"
                className="px-4 py-2 text-lg text-surface bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Únete
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-on-surface hover:text-primary"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-surface-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV_LINKS.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base text-on-surface hover:text-primary rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base text-on-surface hover:text-primary rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              )
            ))}
            {privateNavItem && (
              <Link
                href={privateNavItem.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base text-primary hover:text-primary/80 rounded-md transition-colors"
              >
                {privateNavItem.label}
              </Link>
            )}
            <div className="pt-4 space-y-2 border-t border-surface-border mt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full px-3 py-2 text-base text-primary text-center border border-primary rounded-lg"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base text-surface bg-primary text-center rounded-lg"
                >
                  Únete
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

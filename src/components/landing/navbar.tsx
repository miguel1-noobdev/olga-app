'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '#hero', label: 'Inicio' },
  { href: '#productos', label: 'Productos' },
  { href: '#metodos', label: 'Métodos' },
  { href: '#journal', label: 'Journal' },
  { href: '#glosario', label: 'Glosario' },
  { href: '#olga', label: 'Sobre Olga' },
  { href: '#unete', label: 'Únete' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-glass border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-serif text-primary font-bold">
              Botánica Esencial
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-on-surface hover:text-primary
                           rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-primary border border-primary
                       rounded-lg hover:bg-primary/10 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm text-surface bg-primary
                       rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear cuenta
            </Link>
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
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base text-on-surface hover:text-primary
                         rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-2 border-t border-surface-border mt-2">
              <Link
                href="/login"
                className="block px-3 py-2 text-base text-primary text-center
                         border border-primary rounded-lg"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 text-base text-surface bg-primary text-center
                         rounded-lg"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
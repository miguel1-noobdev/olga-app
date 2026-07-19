'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ExternalLinkIcon, MenuIcon, CloseIcon } from '@/components/ui/icons';

const NAV_LINKS = [
  { href: '/laboratorio/formulas', label: 'Fórmulas', icon: 'science' },
  { href: '/laboratorio/lotes', label: 'Lotes', icon: 'inventory_2' },
  { href: '/laboratorio/plantas', label: 'Mi jardín', icon: 'yard' },
  { href: '/laboratorio/aceites', label: 'Mis aceites', icon: 'opacity' },
];

export default function LaboratoryNavbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname() ?? '';

  const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="relative sticky top-0 z-50 flex w-full items-center justify-between border-b border-primary/20 bg-surface-dim px-6 py-4 shadow-[0_0_15px_rgba(150,248,255,0.1)]">
      <div className="flex items-center gap-8">
        <Link href="/laboratorio" className="font-headline text-xl font-black uppercase tracking-widest text-primary transition-opacity hover:opacity-90">
          <span className="material-symbols-outlined mr-3 align-[-0.2em] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
          Laboratorio Final
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive = isActiveRoute(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center border-b-2 pb-1 font-headline text-sm tracking-tight transition-colors duration-200 active:scale-95 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="hidden items-center gap-2 font-label text-sm text-on-surface-variant transition-colors hover:text-primary md:flex"
        >
          <ExternalLinkIcon className="w-4 h-4" />
          Ver sitio público
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="hidden rounded-full border border-outline-variant/50 bg-surface-variant p-2 text-on-surface-variant transition-colors hover:text-primary md:block"
          aria-label="Cerrar sesión"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          className="md:hidden p-2 text-on-surface hover:text-primary transition-colors"
          aria-label="Toggle navigation"
          aria-expanded={isMobileOpen}
          aria-controls="laboratory-mobile-navigation"
        >
          {isMobileOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {isMobileOpen && (
        <div
          id="laboratory-mobile-navigation"
          role="navigation"
          aria-label="Navegación móvil del laboratorio"
          className="md:hidden absolute top-full left-0 right-0 bg-surface-container border-b border-outline-variant shadow-lg"
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive = isActiveRoute(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-body text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-surface-variant'
                      : 'text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-outline-variant my-2" />
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md font-body text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4 text-primary" />
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md font-body text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

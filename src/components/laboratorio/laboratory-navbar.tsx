'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  return (
    <nav className="bg-surface-container-low border-b border-outline-variant top-0 z-50 flex justify-between items-center px-6 py-3 w-full">
      <div className="flex items-center gap-8">
        <Link href="/laboratorio" className="font-headline text-xl font-bold tracking-tighter text-primary hover:opacity-90 transition-opacity">
          Laboratorio Final
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors duration-200 cursor-pointer active:opacity-80 px-2 py-1 rounded font-body text-sm font-medium tracking-tight"
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors duration-200 cursor-pointer active:opacity-80 px-3 py-1.5 rounded font-label text-sm font-medium"
        >
          <ExternalLinkIcon className="w-4 h-4" />
          Ver sitio público
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="hidden md:block text-primary hover:bg-surface-variant transition-colors duration-200 cursor-pointer active:opacity-80 px-3 py-1.5 rounded font-label text-sm font-medium border border-primary/20 hover:border-primary/50"
        >
          Cerrar sesión
        </button>

        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          className="md:hidden p-2 text-on-surface hover:text-primary transition-colors"
          aria-label="Toggle navigation"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface-container border-b border-outline-variant shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md font-body text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
                {label}
              </Link>
            ))}
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

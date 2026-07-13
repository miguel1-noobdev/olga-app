'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  FlaskIcon,
  LeafIcon,
  DropletIcon,
  HomeIcon,
  ExternalLinkIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/ui/icons';

const NAV_LINKS = [
  { href: '/laboratorio', label: 'Home', icon: HomeIcon },
  { href: '/laboratorio/formulas', label: 'Formulas', icon: FlaskIcon },
  { href: '/laboratorio/lotes', label: 'Lotes', icon: FlaskIcon },
  { href: '/laboratorio/plantas', label: 'Plants', icon: LeafIcon },
  { href: '/laboratorio/aceites', label: 'Oils', icon: DropletIcon },
];

export default function LaboratoryNavbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-glass border-b border-white/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/laboratorio"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FlaskIcon className="w-5 h-5" />
            </div>
            <span className="font-serif text-xl text-on-surface">Laboratory</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Public site
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <LogOutIcon className="w-4 h-4" />
              Sign out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="md:hidden p-2 text-on-surface hover:text-primary transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? (
              <CloseIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-surface-border shadow-md">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md font-sans text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
              >
                <Icon className="w-4 h-4 text-primary" />
                {label}
              </Link>
            ))}
            <div className="border-t border-surface-border my-2" />
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md font-sans text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4 text-primary" />
              Public site
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md font-sans text-sm font-medium text-on-surface hover:bg-surface-container transition-colors text-left"
            >
              <LogOutIcon className="w-4 h-4 text-primary" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

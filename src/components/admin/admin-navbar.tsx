'use client';

import Link from 'next/link';

export default function AdminNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-[10px] border-b border-white/20 shadow-[0px_10px_30px_rgba(45,74,46,0.08)]">
      <div className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-serif text-xl text-primary">A</span>
          </div>
          <span className="font-serif text-xl text-on-surface">
            Admin Panel
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/admin/blog"
            className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            Artículos
          </Link>
          <Link
            href="/"
            className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            Ver Sitio
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

import Link from 'next/link';

export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/20 bg-surface/80 px-8 py-5">
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Botánica Esencial OB
        </p>
        <h1 className="font-serif text-2xl text-on-surface">Dashboard Admin</h1>
      </div>
      <Link
        href="/"
        className="font-sans text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        Ver sitio
      </Link>
    </header>
  );
}

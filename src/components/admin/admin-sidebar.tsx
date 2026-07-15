import Link from 'next/link';

const navigation = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/contenido', label: 'Contenido' },
  { href: '/admin/botanico', label: 'Catálogo botánico' },
  { href: '/admin/salud', label: 'Salud del sistema' },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/20 bg-primary/[0.04] p-6 md:block">
      <nav aria-label="Dashboard Admin">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-4 py-3 font-sans text-sm font-semibold text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

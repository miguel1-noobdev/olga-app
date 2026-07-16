import Link from 'next/link';

interface HubCardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  accent: 'primary' | 'tertiary' | 'secondary-dim';
}

function HubCard({ href, title, description, icon, accent }: HubCardProps) {
  const hoverBorder = accent === 'tertiary'
    ? 'hover:border-tertiary'
    : accent === 'secondary-dim'
      ? 'hover:border-secondary-dim'
      : 'hover:border-primary';
  const hoverText = accent === 'tertiary'
    ? 'group-hover:text-tertiary'
    : accent === 'secondary-dim'
      ? 'group-hover:text-secondary-dim'
      : 'group-hover:text-primary';
  const iconHoverBg = accent === 'tertiary'
    ? 'group-hover:bg-tertiary/10'
    : accent === 'secondary-dim'
      ? 'group-hover:bg-secondary-dim/10'
      : 'group-hover:bg-primary/10';
  const gradient = accent === 'tertiary'
    ? 'from-tertiary/5'
    : accent === 'secondary-dim'
      ? 'from-secondary-dim/5'
      : 'from-primary/5';

  return (
    <Link
      href={href}
      className={`group relative bg-surface-container border border-surface-bright ${hoverBorder} rounded-lg p-6 transition-all duration-300 flex flex-col h-full overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      <div className={`w-12 h-12 rounded-lg bg-surface-bright flex items-center justify-center mb-6 ${iconHoverBg} transition-colors`}>
        <span className={`material-symbols-outlined text-3xl text-secondary ${hoverText} transition-colors`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <h2 className={`font-headline text-xl font-bold text-on-surface mb-2 ${hoverText} transition-colors`}>{title}</h2>
      <p className="font-body text-sm text-on-surface-variant flex-1">{description}</p>
      <div className="mt-6 flex justify-end">
        <span className={`material-symbols-outlined text-on-surface-variant ${hoverText} transform group-hover:translate-x-1 transition-all`}>
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

export default async function LaboratoryHomePage() {
  return (
    <main className="flex-1 container mx-auto px-6 py-12 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface tracking-tight">Hola, Olga</h1>
          <p className="font-body text-on-surface-variant mt-2 text-lg">Panel de operaciones del laboratorio</p>
        </div>
        <Link
          href="/laboratorio/formulas/nueva"
          className="bg-primary text-on-primary-container hover:bg-primary-dim transition-colors duration-200 px-5 py-2.5 rounded-DEFAULT font-label font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(150,248,255,0.15)] hover:shadow-[0_0_20px_rgba(150,248,255,0.3)] w-fit"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          Nueva fórmula
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HubCard
          href="/laboratorio/formulas"
          title="Fórmulas"
          description="Diseñá y validá tus fórmulas."
          icon="science"
          accent="primary"
        />
        <HubCard
          href="/laboratorio/lotes"
          title="Lotes"
          description="Registrá y seguí cada elaboración."
          icon="inventory_2"
          accent="primary"
        />
        <HubCard
          href="/laboratorio/plantas"
          title="Mi jardín"
          description="Consultá tus plantas y sus propiedades."
          icon="yard"
          accent="tertiary"
        />
        <HubCard
          href="/laboratorio/aceites"
          title="Mis aceites"
          description="Gestioná tus aceites e infusiones."
          icon="opacity"
          accent="secondary-dim"
        />
      </section>
    </main>
  );
}

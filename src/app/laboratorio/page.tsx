import Link from 'next/link';
import { FlaskIcon, LeafIcon, ArrowRightIcon, PlusIcon } from '@/components/ui/icons';
import type { ReactNode } from 'react';

interface HubCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}

function HubCard({ href, title, description, icon }: HubCardProps) {
  return (
    <Link
      href={href}
      className="glass-card rounded-xl p-6 block hover:no-underline group"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 p-3 rounded-lg bg-surface-container text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-xl text-on-surface mb-1">{title}</h2>
          <p className="font-sans text-sm text-on-surface-variant mb-4">
            {description}
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-sans font-medium text-primary group-hover:underline">
            Open
            <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function LaboratoryHomePage() {
  return (
    <main className="min-h-screen bg-surface py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-serif text-4xl text-on-surface mb-2">
              Laboratory
            </h1>
            <p className="font-sans text-lg text-on-surface-variant">
              Private workspace for production planning and raw material consultation.
            </p>
          </div>

          <Link
            href="/laboratorio/formulas/nueva"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New formula
          </Link>
        </div>

        <section className="glass-card rounded-xl p-6 mb-8">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Suggested flow
          </h2>
          <p className="font-sans text-sm text-on-surface">
            Work starts from a formula. Once a formula is ready, create production lots
            from it. Consult plants and oils as reference when designing or adjusting
            a formula.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HubCard
            href="/laboratorio/formulas"
            title="Formulas"
            description="Browse, create and edit product formulas."
            icon={<FlaskIcon className="w-6 h-6" />}
          />
          <HubCard
            href="/laboratorio/plantas"
            title="Plants"
            description="Consult the internal botanical inventory."
            icon={<LeafIcon className="w-6 h-6" />}
          />
          <HubCard
            href="/laboratorio/aceites"
            title="Oils"
            description="Review oils, phases and recommended percentages."
            icon={<FlaskIcon className="w-6 h-6" />}
          />
        </div>
      </div>
    </main>
  );
}

import type { HealthCheck, HealthState } from '@/lib/admin/health';

interface HealthCardProps {
  name: string;
  check: HealthCheck<Record<string, boolean>>;
}

const stateLabels: Record<HealthState, string> = {
  ready: 'Disponible',
  degraded: 'Degradado',
  unavailable: 'No disponible',
};

export default function HealthCard({ name, check }: HealthCardProps) {
  return (
    <article className="rounded-xl border border-white/20 bg-white/50 p-6 shadow-sm">
      <h2 className="font-serif text-2xl text-on-surface">{name}</h2>
      <p className="mt-3 font-sans text-sm font-semibold text-on-surface-variant">
        {stateLabels[check.state]}
      </p>
    </article>
  );
}

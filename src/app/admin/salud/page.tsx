import HealthCard from '@/components/admin/health-card';
import { getHealthReport } from '@/lib/admin/health';

export default async function AdminHealthPage() {
  const report = await getHealthReport();

  return (
    <main className="px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-4xl text-on-surface">Salud del sistema</h1>
        <p className="mt-2 font-sans text-base text-on-surface-variant">
          Estado seguro de las capacidades esenciales del Dashboard Admin.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <HealthCard name="Aplicación" check={report.application} />
          <HealthCard name="MongoDB" check={report.mongo} />
          <HealthCard name="Autenticación" check={report.auth} />
        </div>
      </div>
    </main>
  );
}

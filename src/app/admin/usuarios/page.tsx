import UserManagement from '@/components/admin/user-management';
import { createAdministrativeAuditRepository } from '@/lib/admin/users/activity';
import { approvedDirectoryUser } from '@/lib/admin/users/role-change';
import { connectToDatabase } from '@/lib/db/connect';
import { createUserRepository } from '@/lib/db/repository/user';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await connectToDatabase();
  const [users, activity] = await Promise.all([
    createUserRepository().findAll(),
    createAdministrativeAuditRepository().listSummaries(),
  ]);

  return (
    <main className="min-h-full bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 font-serif text-4xl text-on-surface">Usuarios</h1>
        <p className="mb-8 font-sans text-on-surface-variant">
          Administrar roles y acceso con confirmación explícita.
        </p>
        <UserManagement users={users.map(approvedDirectoryUser)} />
        <section className="mt-10" aria-label="Actividad administrativa">
          <h2 className="mb-4 font-serif text-2xl text-on-surface">Actividad administrativa</h2>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            {activity.map((event, index) => (
              <li key={`${event.type}-${event.occurredAt}-${index}`}>
                {event.type === 'role_changed' ? 'Cambio de rol' : 'Cambio de estado de acceso'}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

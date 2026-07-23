'use client';

import { useState } from 'react';
import type { ApprovedDirectoryUser } from '@/lib/admin/users/role-change';

interface UserManagementProps {
  users: ApprovedDirectoryUser[];
}

async function submitMutation(payload: Record<string, unknown>): Promise<void> {
  const response = await fetch('/api/admin/usuarios', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar el usuario');
  }
}

export default function UserManagement({ users }: UserManagementProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function confirmMutation(userId: string, description: string, payload: Record<string, unknown>) {
    if (isPending) {
      return;
    }

    if (!window.confirm(`Confirmar cambio para ${description}?`)) {
      return;
    }

    setError(null);
    setIsPending(true);
    try {
      await submitMutation({ userId, ...payload, confirmed: true });
      window.location.reload();
    } catch {
      setError('No se pudo actualizar el usuario.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section aria-label="Directorio de usuarios" className="space-y-4">
      {error ? <p role="alert" aria-live="assertive">{error}</p> : null}
      {users.map((user) => (
        <article key={user.id} className="rounded-xl border border-white/20 bg-white/50 p-5">
          <p className="font-semibold text-on-surface">{user.email}</p>
          <p className="text-sm text-on-surface-variant">Rol: {user.role}</p>
          <p className="text-sm text-on-surface-variant">Acceso: {user.accountStatus}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => confirmMutation(user.id, user.email, { role: 'suscriptora' })}
              disabled={isPending}
            >
              Convert to suscriptora
            </button>
            <button
              type="button"
              onClick={() => confirmMutation(user.id, user.email, { role: 'productora' })}
              disabled={isPending}
            >
              Convert to productora
            </button>
            <button
              type="button"
              onClick={() => confirmMutation(user.id, user.email, { role: 'admin' })}
              disabled={isPending}
            >
              Convert to admin
            </button>
            <button
              type="button"
              onClick={() => confirmMutation(user.id, user.email, {
                accountStatus: user.accountStatus === 'active' ? 'suspended' : 'active',
              })}
              disabled={isPending}
            >
              {user.accountStatus === 'active' ? `Suspend ${user.email}` : `Activate ${user.email}`}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

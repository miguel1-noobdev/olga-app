'use client';

import { useState } from 'react';

type ContentAction = 'review' | 'publish' | 'unpublish';

export default function ContentActions({ id, state }: { id: string; state: string }) {
  const [pending, setPending] = useState<ContentAction | null>(null);
  const [error, setError] = useState('');

  const actions: ContentAction[] = state === 'draft'
    ? ['review']
    : state === 'reviewed'
      ? ['publish']
      : state === 'published'
        ? ['unpublish']
        : ['review'];

  async function perform(action: ContentAction) {
    setPending(action);
    setError('');
    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || 'No se pudo actualizar el artículo');
      }
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el artículo');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => perform(action)}
          disabled={pending !== null}
          className="rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50"
        >
          {action === 'review' ? 'Revisar' : action === 'publish' ? 'Publicar' : 'Despublicar'}
        </button>
      ))}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

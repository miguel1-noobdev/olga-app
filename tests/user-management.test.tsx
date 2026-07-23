import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UserManagement from '@/components/admin/user-management';

describe('UserManagement', () => {
  it('does not send a mutation when the confirmation is cancelled', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<UserManagement users={[{
      id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active', createdAt: '2026-07-16T00:00:00.000Z',
    }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Suspend reader@example.com' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends an explicitly confirmed approved access-status mutation', () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<UserManagement users={[{
      id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active', createdAt: '2026-07-16T00:00:00.000Z',
    }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Suspend reader@example.com' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/usuarios', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ userId: 'user-1', accountStatus: 'suspended', confirmed: true }),
    }));
  });

  it('prevents duplicate mutations, announces a safe failure, and clears pending state', async () => {
    let rejectRequest!: (reason: Error) => void;
    const fetchMock = vi.fn(() => new Promise<never>((_, reject) => {
      rejectRequest = reject;
    }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<UserManagement users={[{
      id: 'user-1', email: 'reader@example.com', role: 'suscriptora', accountStatus: 'active', createdAt: '2026-07-16T00:00:00.000Z',
    }]} />);

    const button = screen.getByRole('button', { name: 'Suspend reader@example.com' });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rejectRequest(new Error('MongoServerSelectionError mongodb://secret-host/app'));
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo actualizar el usuario.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});

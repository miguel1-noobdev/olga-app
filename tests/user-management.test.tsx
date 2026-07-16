import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArticleForm from '@/components/admin/article-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe('ArticleForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('announces rejected article creation and re-enables the form without exposing backend details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('CastError mongodb://secret-host/app')));
    render(<ArticleForm />);

    fireEvent.submit(screen.getByRole('button', { name: /crear borrador/i }).closest('form')!);

    await waitFor(() => expect(screen.getByRole('button', { name: /crear borrador/i })).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear el artículo. Intentá de nuevo.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('mongodb://secret-host');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});

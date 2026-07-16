import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { findAllMock } = vi.hoisted(() => ({ findAllMock: vi.fn() }));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: vi.fn(() => ({ findAll: findAllMock })),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import AdminContentPage from '@/app/admin/contenido/page';

describe('/admin/contenido page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows private drafts to Admin with a private preview link', async () => {
    findAllMock.mockResolvedValue([{
      id: 'article-1', title: 'Borrador de lavanda', category: 'Rituales', readingTime: '3 min',
      published: false, publishedAt: null, reviewedAt: null, unpublishedAt: null,
    }]);

    render(await AdminContentPage());

    expect(screen.getByText('Borrador de lavanda')).toBeInTheDocument();
    expect(screen.getByText(/Borrador · Rituales/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previsualizar' })).toHaveAttribute(
      'href', '/admin/contenido/article-1/previsualizar'
    );
    expect(screen.getByRole('link', { name: 'Nuevo artículo' })).toHaveAttribute('href', '/admin/contenido/nuevo');
  });
});

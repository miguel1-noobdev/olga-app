import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

const { findAllPublishedMock } = vi.hoisted(() => ({
  findAllPublishedMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('@/lib/db/repository/article', () => ({
  createArticleRepository: vi.fn(() => ({
    findAllPublished: findAllPublishedMock,
  })),
}));

import AdminBlogPage from '@/app/admin/blog/page';

describe('/admin/blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists published articles without an edit action', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    });

    findAllPublishedMock.mockResolvedValue([
      {
        id: 'article-1',
        title: 'Ritual de lavanda',
        category: 'Rituales',
        readingTime: '3 min de lectura',
        slug: 'ritual-de-lavanda',
        publishedAt: '2026-07-08T12:00:00.000Z',
      },
    ]);

    const jsx = await AdminBlogPage();
    render(jsx);

    expect(screen.getByText('Ritual de lavanda')).toBeInTheDocument();
    expect(screen.getByText('Ver')).toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

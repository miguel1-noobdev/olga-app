import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/components/admin/article-form', () => ({
  default: () => <div data-testid="article-form">ArticleForm</div>,
}));

import AdminBlogNuevoPage from '@/app/admin/blog/nuevo/page';

describe('/admin/blog/nuevo page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the article form for admin users', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
    });

    const jsx = await AdminBlogNuevoPage();
    render(jsx);

    expect(screen.getByTestId('article-form')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

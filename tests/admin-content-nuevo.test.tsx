import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/admin/article-form', () => ({
  default: ({ successHref }: { successHref: string }) => <div data-success-href={successHref}>ArticleForm</div>,
}));

import AdminContentNewPage from '@/app/admin/contenido/nuevo/page';

describe('/admin/contenido/nuevo page', () => {
  it('returns intake to the Admin content lifecycle', () => {
    render(<AdminContentNewPage />);

    expect(screen.getByText('ArticleForm')).toHaveAttribute('data-success-href', '/admin/contenido');
  });
});

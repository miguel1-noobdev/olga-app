import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { findByIdMock } = vi.hoisted(() => ({ findByIdMock: vi.fn() }));
vi.mock('@/lib/db/connect', () => ({ connectToDatabase: vi.fn() }));
vi.mock('@/lib/db/repository/article', () => ({ createArticleRepository: vi.fn(() => ({ findById: findByIdMock })) }));
vi.mock('next/navigation', () => ({ notFound: vi.fn() }));

import AdminContentPreviewPage from '@/app/admin/contenido/[id]/previsualizar/page';

describe('/admin/contenido/[id]/previsualizar page', () => {
  it('renders an Admin-only preview of a private draft', async () => {
    findByIdMock.mockResolvedValue({ title: 'Borrador privado', content: 'Contenido sin publicar', category: 'Blog' });

    render(await AdminContentPreviewPage({ params: { id: 'draft-1' } }));

    expect(screen.getByText('Vista previa privada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Borrador privado' })).toBeInTheDocument();
    expect(screen.getByText('Contenido sin publicar')).toBeInTheDocument();
  });
});

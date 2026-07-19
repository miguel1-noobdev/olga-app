import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OilRecord } from '@/lib/db/repository/oil';

const { connectToDatabaseMock, findBySlugMock, notFoundMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findBySlugMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({ connectToDatabase: connectToDatabaseMock }));
vi.mock('@/lib/db/repository/oil', () => ({ createOilRepository: () => ({ findBySlug: findBySlugMock }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => { notFoundMock(); throw new Error('NEXT_NOT_FOUND'); },
}));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => <a href={href} {...props}>{children}</a> }));

import LaboratoryOilDetailPage from '@/app/laboratorio/aceites/[slug]/page';
import OilInternalDetail from '@/components/laboratorio/oil-internal-detail';

function buildOil(overrides: Partial<OilRecord> = {}): OilRecord {
  return {
    id: 'oil-1', slug: 'aceite-de-oliva', name: 'Aceite de oliva', inciName: 'Olea Europaea Fruit Oil', hlb: 7,
    phase: 'oil', recommendedPercentage: null, observations: 'Combina bien.', notes: 'Usar en pruebas de textura.',
    solubility: 'Liposoluble', skinTypes: ['Seca'], absorption: 'Lenta', properties: ['Regenerador'],
    images: [
      { url: 'https://example.test/olive-1.jpg', alt: 'Aceite de oliva vertido' },
      { url: 'https://example.test/olive-2.jpg', alt: 'Frasco de aceite de oliva' },
    ],
    createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-01T10:00:00.000Z', ...overrides,
  };
}

describe('/laboratorio/aceites/[slug]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the canonical slug and maps every populated detail section', async () => {
    const oil = buildOil();
    findBySlugMock.mockResolvedValue(oil);
    render(await LaboratoryOilDetailPage({ params: { slug: oil.slug } }));

    expect(findBySlugMock).toHaveBeenCalledWith(oil.slug);
    expect(screen.getByRole('link', { name: 'Volver a Mis aceites' })).toHaveAttribute('href', '/laboratorio/aceites');
    expect(screen.getByRole('heading', { name: oil.name })).toBeInTheDocument();
    expect(screen.getByText('Ficha interna - Laboratorio Final')).toBeInTheDocument();
    expect(screen.getAllByText('Liposoluble')).toHaveLength(2);
    expect(screen.getByText('Especificaciones')).toBeInTheDocument();
    expect(screen.getByText('Aplicación cosmética')).toBeInTheDocument();
    expect(screen.getByText('Notas de formulación')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Aceite de oliva vertido' })).toHaveAttribute('src', 'https://example.test/olive-1.jpg');
    expect(screen.getByRole('contentinfo', { name: 'Notas internas' })).toBeInTheDocument();
  });

  it('uses the not-found boundary for an unknown slug', async () => {
    findBySlugMock.mockResolvedValue(null);
    await expect(LaboratoryOilDetailPage({ params: { slug: 'unknown' } })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('renders honest empty states for absent optional detail fields and gallery images', () => {
    render(<OilInternalDetail oil={buildOil({ solubility: undefined, skinTypes: [], absorption: undefined, properties: [], images: [] })} />);
    expect(screen.getAllByText('Sin datos registrados').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('No hay imágenes de referencia cargadas para este aceite.')).toBeInTheDocument();
  });

  it('uses stored URL image records in an accessible lightbox', () => {
    render(<OilInternalDetail oil={buildOil()} />);
    const thumbnail = screen.getByRole('button', { name: 'Ampliar Aceite de oliva vertido' });
    fireEvent.click(thumbnail);
    expect(screen.getByRole('dialog', { name: 'Vista ampliada de Aceite de oliva vertido' })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('img', { name: 'Aceite de oliva vertido' })).toHaveAttribute('src', 'https://example.test/olive-1.jpg');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the Stitch bento hierarchy and notes footer after the gallery', () => {
    const html = renderToStaticMarkup(<OilInternalDetail oil={buildOil()} />);
    expect(html).toContain('grid grid-cols-1 gap-6 lg:grid-cols-3');
    expect(html).toContain('flex flex-col gap-4 lg:col-span-2');
    expect(html).toContain('lg:col-start-3 grid grid-cols-1 gap-4');
    expect(html).toContain('grid grid-cols-1 gap-4');
    expect(html).toContain('block aspect-video overflow-hidden');
    expect(html).toContain('bg-surface-container');
    expect(html).toContain('text-primary-dim');
    expect(html).toContain('text-secondary-fixed-dim');
    expect(html.indexOf('aria-label="Notas internas"')).toBeGreaterThan(html.indexOf('Galería de referencia'));
  });
});

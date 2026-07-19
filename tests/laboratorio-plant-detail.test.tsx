import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullPlant } from '@/lib/plantas/full-domain';

const { connectToDatabaseMock, findBySlugMock, notFoundMock } = vi.hoisted(() => ({
  connectToDatabaseMock: vi.fn(),
  findBySlugMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock('@/lib/db/connect', () => ({
  connectToDatabase: connectToDatabaseMock,
}));

vi.mock('@/lib/plantas/full-domain', () => ({
  createFullPlantRepository: () => ({
    findBySlug: findBySlugMock,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import LaboratoryPlantDetailPage from '@/app/laboratorio/plantas/[slug]/page';
import PlantInternalDetail from '@/components/laboratorio/plant-internal-detail';

function buildPlant(overrides: Partial<FullPlant> = {}): FullPlant {
  return {
    id: 'plant-1',
    commonName: 'Lavanda',
    scientificName: 'Lavandula angustifolia Mill.',
    species: 'Lavandula angustifolia',
    slug: 'lavandula-angustifolia-mill',
    family: 'Lamiaceae',
    usedParts: ['Flores', 'Sumidades floridas'],
    description: 'Planta aromática perenne para preparaciones cosméticas.',
    compounds: [
      { name: 'Linalool', percentage: '25-38%', description: 'Alcohol terpénico.' },
      { name: 'Acetato de linalilo', percentage: '25-45%' },
    ],
    properties: { oral: ['Ansiolítico'], topical: ['Cicatrizante', 'Antiséptico'] },
    contraindications: ['Hipersensibilidad a la planta'],
    availableExtracts: [
      { type: 'Aceite esencial', method: 'Destilación', description: '100% puro' },
      { type: 'Hidrolato', description: 'Agua floral' },
    ],
    images: [
      { url: 'https://example.test/lavanda-1.jpg', alt: 'Lavanda en flor' },
      { url: 'https://example.test/lavanda-2.jpg', alt: 'Campo de lavanda' },
    ],
    internal: {
      cultivationNotes: 'Pleno sol y suelo drenado.',
      harvestNotes: 'Cosechar en floración plena.',
      sourcingNotes: 'Proveedor local orgánico.',
      preparationNotes: 'Secado a la sombra.',
      notes: 'Reservar flores para oleato.',
    },
    createdAt: '2026-07-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('/laboratorio/plantas/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the full-domain slug lookup and renders every populated botanical and internal section', async () => {
    const plant = buildPlant();
    findBySlugMock.mockResolvedValue(plant);

    const element = await LaboratoryPlantDetailPage({
      params: { slug: plant.slug },
    });
    render(element);

    expect(connectToDatabaseMock).toHaveBeenCalledOnce();
    expect(findBySlugMock).toHaveBeenCalledWith(plant.slug);
    expect(screen.getByRole('link', { name: 'Volver a Mi jardín' })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(screen.getByRole('heading', { name: 'Lavanda' })).toBeInTheDocument();
    expect(screen.getByText('Ficha Botánica')).toBeInTheDocument();
    expect(screen.getByText('Composición')).toBeInTheDocument();
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Contraindicaciones')).toBeInTheDocument();
    expect(screen.getByText('Extractos disponibles')).toBeInTheDocument();
    expect(screen.getByLabelText('Galería de referencia')).toBeInTheDocument();
    expect(screen.getByText('Cultivo')).toBeInTheDocument();
    expect(screen.getByText('Cosecha')).toBeInTheDocument();
    expect(screen.getByText('Origen')).toBeInTheDocument();
    expect(screen.getByText('Preparación')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: 'Notas internas' })).toBeInTheDocument();
    expect(screen.getByText('Pleno sol y suelo drenado.')).toBeInTheDocument();
    expect(screen.getByText('Cosechar en floración plena.')).toBeInTheDocument();
    expect(screen.getByText('Proveedor local orgánico.')).toBeInTheDocument();
    expect(screen.getByText('Secado a la sombra.')).toBeInTheDocument();
    expect(screen.getByText('Reservar flores para oleato.')).toBeInTheDocument();
    expect(screen.getByAltText('Lavanda en flor')).toHaveAttribute(
      'src',
      'https://example.test/lavanda-1.jpg'
    );
    expect(screen.getByAltText('Campo de lavanda')).toHaveAttribute(
      'src',
      'https://example.test/lavanda-2.jpg'
    );
  });

  it('keeps the four read-only internal fields in the grid and renders empty notes in its footer', () => {
    render(<PlantInternalDetail plant={buildPlant({ internal: undefined })} />);

    expect(screen.getByText('Información interna')).toBeInTheDocument();
    expect(screen.getByText('Cultivo')).toBeInTheDocument();
    expect(screen.getByText('Cosecha')).toBeInTheDocument();
    expect(screen.getByText('Origen')).toBeInTheDocument();
    expect(screen.getByText('Preparación')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: 'Notas internas' })).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos registrados')).toHaveLength(5);
  });

  it('uses the laboratory not-found boundary for an unknown slug', async () => {
    findBySlugMock.mockResolvedValue(null);

    await expect(
      LaboratoryPlantDetailPage({ params: { slug: 'unknown' } })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('renders an honest gallery state when a plant has no image records', () => {
    render(<PlantInternalDetail plant={buildPlant({ images: [] })} />);

    expect(screen.getByText('No hay imágenes de referencia cargadas para esta planta.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the Stitch hierarchy and Tokyo-neon accent contracts', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('grid grid-cols-1 gap-6 lg:grid-cols-3');
    expect(html).toContain('bg-surface-container');
    expect(html).toContain('border-outline-variant');
    expect(html).toContain('text-primary');
    expect(html).toContain('text-secondary');
    expect(html).toContain('text-tertiary');
    expect(html).toContain('border-error/30');
  });

  it('integrates the neon-red contraindication treatment into the container border', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('border-l-4 border-l-error');
    expect(html).toContain('border border-error/30');
    expect(html).not.toContain('absolute left-0 top-0 h-full w-1');
  });

  it('uses a subdued outline token for composition separators', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('border-outline-variant/20');
  });

  it('lays out extracts in responsive, intrinsic-size cells', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('grid grid-cols-1 gap-2 sm:grid-cols-2');
    expect(html).toContain('justify-self-start rounded border border-outline-variant bg-surface-container-high p-3');
  });

  it('renders image records without gallery container chrome', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('lg:col-start-3 grid grid-cols-1 gap-4');
    expect(html).toContain('aria-label="Galería de referencia"');
    expect(html).not.toContain('group relative block aspect-video');
  });

  it('places the editable notes footer after all other detail content without duplicating it in the grid', () => {
    const html = renderToStaticMarkup(<PlantInternalDetail plant={buildPlant()} />);

    expect(html).toContain('<footer');
    expect(html).toContain('aria-label="Notas internas"');
    expect(html).toContain('Reservar flores para oleato.');
    expect(html.indexOf('aria-label="Notas internas"')).toBeGreaterThan(
      html.indexOf('Información interna')
    );
    expect(html.match(/>Notas</g)).toHaveLength(1);
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import PlantCard from '@/components/jardin-digital/plant-card';
import Diario from '@/components/landing/diario';
import ResilientImage from '@/components/ui/resilient-image';
import { isApprovedPlantImageUrl } from '@/lib/validation/plant-image';
import { DEFAULT_REDIRECTS } from '@/lib/auth/role-redirect';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(entryPath)
      : /\.(ts|tsx)$/.test(entry.name)
        ? [entryPath]
        : [];
  });
}

function readSource(): string {
  return sourceFiles(SRC_ROOT)
    .map((filePath) => readFileSync(filePath, 'utf8'))
    .join('\n');
}

const plant = {
  id: 'plant-1',
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia',
  family: 'Lamiaceae',
  slug: 'lavandula-angustifolia',
};

describe('Block 12 asset and navigation integrity', () => {
  it('keeps every browser-served local asset reference backed by public/', () => {
    const references = [...readSource().matchAll(/['"`]((?:\/img\/)[^'"` )]+)['"`]/g)]
      .map((match) => match[1].split('?')[0]);

    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(existsSync(path.join(PROJECT_ROOT, 'public', reference.slice(1))), reference).toBe(true);
    }
  });

  it('contains no browser-visible Stitch, AIDA, or googleusercontent image source', () => {
    expect(readSource()).not.toMatch(/(?:googleusercontent|aida-public|stitch)/i);
  });

  it('renders an honest PlantCard fallback without the missing placeholder path', () => {
    const html = renderToStaticMarkup(<PlantCard plant={plant} />);

    expect(html).not.toContain('/img/placeholder-plant.jpg');
    expect(html).toContain('Imagen no disponible');
    expect(html).toContain('href="/jardin-digital/lavandula-angustifolia"');
    expect(html).toContain('aria-label="Lavanda"');
  });

  it('keeps alt text and layout when an image fails without exposing its URL', () => {
    const failedUrl = 'https://upload.wikimedia.org/wikipedia/commons/not-found.jpg';
    render(
      <ResilientImage
        src={failedUrl}
        alt="Lavanda en flor"
        className="h-full w-full object-cover"
      />,
    );

    expect(screen.getByAltText('Lavanda en flor')).toBeInTheDocument();
    fireEvent.error(screen.getByAltText('Lavanda en flor'));

    expect(screen.getByRole('img', { name: 'Lavanda en flor' })).toHaveClass('h-full', 'w-full');
    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(failedUrl);
  });

  it('uses stored article alt text in Diario content images instead of CSS backgrounds', () => {
    const html = renderToStaticMarkup(
      <Diario
        articles={[{
          id: 'article-1',
          title: 'Una nota',
          slug: 'una-nota',
          excerpt: 'Un extracto',
          content: 'Contenido',
          category: 'Blog',
          image: '/img/hero-img2.png',
          imageAlt: 'Hojas del jardín al amanecer',
          readingTime: '2 min',
          published: true,
          publishedAt: '2026-07-24T00:00:00.000Z',
          createdAt: '2026-07-24T00:00:00.000Z',
        }]}
      />,
    );

    expect(html).toContain('alt="Hojas del jardín al amanecer"');
    expect(html).toContain('<img');
    expect(html).not.toContain('background-image');
  });

  it('uses the shared failure strategy for browser-visible image families', () => {
    for (const fileName of [
      'src/components/jardin-digital/image-gallery.tsx',
      'src/components/jardin-digital/plant-card.tsx',
      'src/components/blog/article-card.tsx',
      'src/components/landing/diario.tsx',
      'src/components/laboratorio/oil-reference-gallery.tsx',
      'src/components/landing/olga.tsx',
    ]) {
      const source = readFileSync(path.join(PROJECT_ROOT, fileName), 'utf8');
      expect(source, fileName).toContain('<ResilientImage');
    }
  });

  it('accepts only approved plant image sources at the plant persistence boundary', () => {
    expect(isApprovedPlantImageUrl('/img/hero-img2.png')).toBe(true);
    expect(isApprovedPlantImageUrl('https://upload.wikimedia.org/wikipedia/commons/e/ef/plant.jpg')).toBe(true);
    expect(isApprovedPlantImageUrl('https://images.example/plant.jpg')).toBe(false);
    expect(isApprovedPlantImageUrl('https://lh3.googleusercontent.com/aida-public/plant.jpg')).toBe(false);
    expect(isApprovedPlantImageUrl('/img/placeholder-plant.jpg')).toBe(false);
  });

  it('keeps internal redirect destinations mapped to existing application routes', () => {
    const routes = {
      '/': 'src/app/page.tsx',
      '/login': 'src/app/(auth)/login/page.tsx',
      '/register': 'src/app/(auth)/register/page.tsx',
      '/blog': 'src/app/blog/page.tsx',
      '/blog/articulos': 'src/app/blog/articulos/page.tsx',
      '/jardin-digital': 'src/app/jardin-digital/page.tsx',
      '/laboratorio': 'src/app/laboratorio/page.tsx',
      '/admin': 'src/app/admin/page.tsx',
    };

    for (const [route, fileName] of Object.entries(routes)) {
      expect(route.startsWith('/')).toBe(true);
      expect(existsSync(path.join(PROJECT_ROOT, fileName)), route).toBe(true);
    }

    expect(DEFAULT_REDIRECTS).toEqual({
      PRODUCTORA: '/laboratorio',
      ADMIN: '/admin',
      SUSCRIPTORA: '/',
    });
  });
});

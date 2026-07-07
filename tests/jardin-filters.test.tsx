import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import JardinFilters from '@/components/jardin-digital/jardin-filters';

describe('JardinFilters', () => {
  it('renders "Todas" button as active by default', () => {
    const html = renderToStaticMarkup(<JardinFilters />);
    expect(html).toContain('Todas');
  });

  it('renders property filter buttons', () => {
    const html = renderToStaticMarkup(<JardinFilters />);
    expect(html).toContain('Digestivas');
    expect(html).toContain('Relajantes');
    expect(html).toContain('Respiratorias');
    expect(html).toContain('Antiinflamatorias');
  });

  it('renders family filter button', () => {
    const html = renderToStaticMarkup(<JardinFilters />);
    expect(html).toContain('Filtrar por Familia');
  });

  it('uses rounded-full for filter buttons', () => {
    const html = renderToStaticMarkup(<JardinFilters />);
    expect(html).toContain('rounded-full');
  });

  it('is sticky positioned', () => {
    const html = renderToStaticMarkup(<JardinFilters />);
    expect(html).toContain('sticky');
  });
});

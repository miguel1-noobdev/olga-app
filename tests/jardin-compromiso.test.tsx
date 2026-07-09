import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import JardinCompromiso from '@/components/jardin-digital/jardin-compromiso';

describe('JardinCompromiso', () => {
  it('renders section title', () => {
    const html = renderToStaticMarkup(<JardinCompromiso />);
    expect(html).toContain('Mi Compromiso');
  });

  it('renders section description', () => {
    const html = renderToStaticMarkup(<JardinCompromiso />);
    expect(html).toContain('Más allá de un catálogo');
  });

  it('renders "Investigación Científica" card', () => {
    const html = renderToStaticMarkup(<JardinCompromiso />);
    expect(html).toContain('Investigación Científica');
  });

  it('renders "Conservación" card', () => {
    const html = renderToStaticMarkup(<JardinCompromiso />);
    expect(html).toContain('Conservación');
  });

  it('renders two commitment cards', () => {
    const html = renderToStaticMarkup(<JardinCompromiso />);
    const cardCount = (html.match(/Investigación Científica|Conservación/g) || []).length;
    expect(cardCount).toBeGreaterThanOrEqual(2);
  });
});

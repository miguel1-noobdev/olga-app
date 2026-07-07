import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import JardinHero from '@/components/jardin-digital/jardin-hero';

describe('JardinHero', () => {
  it('renders badge text', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('Herbario Digital');
  });

  it('renders main title', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('Explora nuestra colección de plantas medicinales');
  });

  it('renders description', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('compendio vivo');
  });

  it('renders CTA buttons', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('Comenzar Recorrido');
    expect(html).toContain('Guía de Cultivo');
  });

  it('renders hero image', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('<img');
  });

  it('uses responsive grid layout', () => {
    const html = renderToStaticMarkup(<JardinHero />);
    expect(html).toContain('grid-cols-1');
    expect(html).toContain('lg:grid-cols-12');
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import JardinFooter from '@/components/jardin-digital/jardin-footer';

describe('JardinFooter', () => {
  it('renders footer title', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).toContain('Jardín Digital');
  });

  it('renders description', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).toContain('Preservando la biodiversidad');
  });

  it('renders navigation links', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).toContain('Privacidad');
    expect(html).toContain('Términos');
    expect(html).toContain('Contacto');
  });

  it('renders copyright', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).toContain('© 2026');
  });

  it('does not use the unreliable icon font', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).not.toContain('material-symbols-outlined');
  });

  it('does not include placeholder destination links', () => {
    const html = renderToStaticMarkup(<JardinFooter />);
    expect(html).not.toContain('href="#"');
  });
});

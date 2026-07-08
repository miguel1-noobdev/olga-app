import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Footer from '@/components/landing/footer';
import Redes from '@/components/landing/redes';
import Products from '@/components/landing/products';
import Unete from '@/components/landing/unete';
import Metodos from '@/components/landing/metodos';
import JardinNavbar from '@/components/jardin-digital/jardin-navbar';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Landing honesty remediation', () => {
  it('Footer does not use material-symbols-outlined or placeholder links', () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).not.toContain('material-symbols-outlined');
    expect(html).not.toContain('href="#"');
    expect(html).toContain('Store locator');
    expect(html).toContain('próximamente');
  });

  it('Redes is not interactive and explains networks are coming soon', () => {
    const html = renderToStaticMarkup(<Redes />);
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain('<a ');
    expect(html).toContain('Próximamente estaremos en redes sociales');
  });

  it('Products does not imply detail pages', () => {
    const html = renderToStaticMarkup(<Products />);
    expect(html).not.toContain('href=');
    expect(html).toContain('próximamente');
  });

  it('Unete links to real registration instead of a fake newsletter form', () => {
    const html = renderToStaticMarkup(<Unete />);
    expect(html).toContain('/register');
    expect(html).toContain('Crear cuenta');
    expect(html).toContain('La suscripción por email llegará pronto');
  });

  it('Metodos does not use material-symbols-outlined', () => {
    const html = renderToStaticMarkup(<Metodos />);
    expect(html).not.toContain('material-symbols-outlined');
  });

  it('JardinNavbar does not use material-symbols-outlined and disables placeholder buttons', () => {
    const html = renderToStaticMarkup(<JardinNavbar />);
    expect(html).not.toContain('material-symbols-outlined');
    expect(html).toContain('disabled');
    expect(html).toContain('Buscar (próximamente)');
    expect(html).toContain('Menú (próximamente)');
  });
});

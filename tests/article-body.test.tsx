import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ArticleBody from '@/components/blog/article-body';

describe('ArticleBody', () => {
  it('renders a heading block from ### prefix', () => {
    const html = renderToStaticMarkup(<ArticleBody content="### Introducción" />);

    expect(html).toContain('<h2');
    expect(html).toContain('Introducción');
  });

  it('renders a list block from dash-prefixed lines', () => {
    const content = '- Primer ítem\n- Segundo ítem\n- Tercer ítem';
    const html = renderToStaticMarkup(<ArticleBody content={content} />);

    expect(html).toContain('<ul');
    expect(html).toContain('>Primer ítem</li>');
    expect(html).toContain('>Segundo ítem</li>');
    expect(html).toContain('>Tercer ítem</li>');
  });

  it('renders a plain paragraph', () => {
    const html = renderToStaticMarkup(
      <ArticleBody content="Este es un párrafo simple sin énfasis." />
    );

    expect(html).toContain('<p');
    expect(html).toContain('Este es un párrafo simple sin énfasis.');
  });

  it('renders inline bold emphasis as strong elements', () => {
    const html = renderToStaticMarkup(
      <ArticleBody content="Este texto tiene **negrita** dentro." />
    );

    expect(html).toContain('<strong');
    expect(html).toContain('>negrita</strong>');
    expect(html).toContain('Este texto tiene');
    expect(html).toContain('dentro.');
  });

  it('renders multiple bold segments in one paragraph', () => {
    const html = renderToStaticMarkup(
      <ArticleBody content="**Primera** mitad y **segunda** mitad." />
    );

    expect(html).toContain('>Primera</strong>');
    expect(html).toContain('>segunda</strong>');
  });

  it('escapes raw HTML instead of executing it', () => {
    const html = renderToStaticMarkup(
      <ArticleBody content="Texto con <script>alert(1)</script> contenido." />
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('applies the intended strong styling class', () => {
    const html = renderToStaticMarkup(<ArticleBody content="**énfasis**" />);

    expect(html).toContain('class="text-on-surface font-semibold"');
  });

  it('does not use dangerouslySetInnerHTML', () => {
    const html = renderToStaticMarkup(
      <ArticleBody content="### Título\n\nPárrafo con **negrita**.\n\n- Uno\n- Dos" />
    );

    expect(html).not.toContain('dangerouslySetInnerHTML');
  });
});

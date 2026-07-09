import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Glosario from '@/components/landing/glosario';

describe('Glosario - Responsive Visual Contract', () => {
  const html = renderToStaticMarkup(<Glosario />);

  describe('Mobile/tablet vertical stack', () => {
    it('renders a stack container visible below lg breakpoint', () => {
      // lg:hidden = visible on mobile/tablet, hidden on desktop-large
      expect(html).toContain('lg:hidden');
    });

    it('renders all ingredient cards in the vertical stack', () => {
      // Each card in the stack has position:sticky and height 400px
      expect(html).toContain('Lavanda');
      expect(html).toContain('Caléndula');
      expect(html).toContain('Aloe Vera');
      expect(html).toContain('Café Puro');
    });
  });

  describe('Desktop horizontal track', () => {
    it('renders a track container hidden below lg and visible at lg+', () => {
      // hidden lg:block = hidden on mobile/tablet, visible on desktop-large
      expect(html).toContain('hidden');
      expect(html).toContain('lg:block');
    });

    it('renders desktop cards with 300x400 dimensions', () => {
      expect(html).toContain('w-[300px]');
      expect(html).toContain('h-[400px]');
    });

    it('renders all ingredient names in the desktop track', () => {
      // Both containers render ingredient names; verify they are present
      const names = ['Lavanda', 'Caléndula', 'Aloe Vera', 'Café Puro'];
      for (const name of names) {
        const occurrences = html.split(name).length - 1;
        // Each name appears at least twice: once in mobile stack, once in desktop track
        expect(occurrences).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Scroll-driven animation setup', () => {
    it('uses a tall track to enable scroll-driven progress', () => {
      // Desktop track has h-[1500px] to create scroll range
      expect(html).toContain('h-[1500px]');
    });

    it('pins the viewport at 50vh minus half card height (200px)', () => {
      // top-[calc(50vh-200px)] = viewportHeight * 0.5 - CARD_HEIGHT / 2
      expect(html).toContain('top-[calc(50vh-200px)]');
    });

    it('uses sticky positioning for the desktop viewport', () => {
      expect(html).toContain('sticky');
    });
  });

  describe('Section structure', () => {
    it('renders the section with glosario id', () => {
      expect(html).toContain('id="glosario"');
    });

    it('renders the section heading', () => {
      expect(html).toContain(
        'Aprendé sobre mi despensa botánica',
      );
    });

    it('renders a "LEER MÁS" link to jardin-digital', () => {
      expect(html).toContain('LEER MÁS');
      expect(html).toContain('href="/jardin-digital"');
    });
  });
});

describe('Glosario - Teaser click-through', () => {
  it('renders every ingredient card as a link to /jardin-digital', () => {
    render(<Glosario />);

    const ingredientNames = ['Lavanda', 'Caléndula', 'Aloe Vera', 'Café Puro'];
    const allLinks = screen.getAllByRole('link');
    const jardinLinks = allLinks.filter(
      (link) => link.getAttribute('href') === '/jardin-digital',
    );

    // 4 mobile cards + 4 desktop cards + 1 CTA = 9 total links
    expect(jardinLinks).toHaveLength(9);

    for (const name of ingredientNames) {
      const linksForName = jardinLinks.filter((link) =>
        link.textContent?.includes(name),
      );
      // One link in mobile stack, one in desktop track
      expect(linksForName).toHaveLength(2);
    }
  });

  it('keeps the existing LEER MÁS CTA link', () => {
    render(<Glosario />);

    const cta = screen.getByRole('link', { name: /leer más/i });
    expect(cta).toHaveAttribute('href', '/jardin-digital');
  });
});

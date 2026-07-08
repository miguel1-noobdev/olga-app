import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig';

const ROOT = resolve(__dirname, '..');
const TAILWIND_CONFIG_PATH = resolve(ROOT, 'tailwind.config.ts');
const GLOBALS_CSS_PATH = resolve(ROOT, 'src/styles/globals.css');

interface TailwindConfig {
  theme: {
    extend: {
      colors: Record<string, string>;
      fontFamily: Record<string, string[]>;
      borderRadius: Record<string, string>;
    };
  };
}

function loadTailwindConfig(): TailwindConfig {
  // tailwind config is TS but the runtime values are plain JS-compatible
  // when imported through Vitest's TS transformer.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(TAILWIND_CONFIG_PATH);
  return mod.default ?? mod;
}

describe('glassmorphism design tokens (T-003)', () => {
  describe('tailwind.config.ts', () => {
    let config: TailwindConfig;

    beforeAll(() => {
      config = loadTailwindConfig();
    });

    it('extends theme.colors with the primary verde botanico', () => {
      expect(config.theme.extend.colors.primary).toBe('#334537');
    });

    it('extends theme.colors with the secondary dorado accent', () => {
      expect(config.theme.extend.colors.secondary).toBe('#e9c349');
    });

    it('extends theme.colors with the surface crema background', () => {
      expect(config.theme.extend.colors.surface).toBe('#f4fbf2');
    });

    it('extends theme.colors with the surface container', () => {
      expect(config.theme.extend.colors['surface-container']).toBe('#e9f0e7');
    });

    it('extends theme.colors with the surface border / variant', () => {
      expect(config.theme.extend.colors['surface-border']).toBe('#dde4db');
    });

    it('extends theme.fontFamily with Playfair Display for headlines', () => {
      const headlineFamilies = Object.values(
        config.theme.extend.fontFamily
      ).flat();
      expect(headlineFamilies).toContain('Playfair Display');
    });

    it('extends theme.fontFamily with Plus Jakarta Sans for body', () => {
      const bodyFamilies = Object.values(config.theme.extend.fontFamily).flat();
      expect(bodyFamilies).toContain('Plus Jakarta Sans');
    });

    it('exposes a serif alias for Playfair (font-serif)', () => {
      expect(config.theme.extend.fontFamily.serif).toEqual(
        expect.arrayContaining(['Playfair Display'])
      );
    });

    it('exposes a sans alias for Plus Jakarta (font-sans)', () => {
      expect(config.theme.extend.fontFamily.sans).toEqual(
        expect.arrayContaining(['Plus Jakarta Sans'])
      );
    });
  });

  describe('resolved config (token values that Tailwind will compile)', () => {
    let resolved: ReturnType<typeof resolveConfig>;

    beforeAll(() => {
      resolved = resolveConfig(loadTailwindConfig());
    });

    it('resolves the primary color to #334537', () => {
      // Tailwind normalizes `theme.extend.colors.primary` into `theme.colors.primary`
      expect(
        (resolved.theme?.colors as Record<string, string>).primary
      ).toBe('#334537');
    });

    it('resolves the secondary color to #e9c349', () => {
      expect(
        (resolved.theme?.colors as Record<string, string>).secondary
      ).toBe('#e9c349');
    });

    it('resolves the surface color to #f4fbf2', () => {
      expect(
        (resolved.theme?.colors as Record<string, string>).surface
      ).toBe('#f4fbf2');
    });

    it('resolves the surface-container color to #e9f0e7', () => {
      expect(
        (resolved.theme?.colors as Record<string, string>)['surface-container']
      ).toBe('#e9f0e7');
    });

    it('resolves the surface-border color to #dde4db', () => {
      expect(
        (resolved.theme?.colors as Record<string, string>)['surface-border']
      ).toBe('#dde4db');
    });

    it('resolves the serif font family to start with the CSS variable', () => {
      const serif = (resolved.theme?.fontFamily as Record<string, string[]>)
        .serif;
      expect(serif[0]).toBe('var(--font-serif)');
      expect(serif).toContain('Playfair Display');
    });

    it('resolves the sans font family to start with the CSS variable', () => {
      const sans = (resolved.theme?.fontFamily as Record<string, string[]>)
        .sans;
      expect(sans[0]).toBe('var(--font-sans)');
      expect(sans).toContain('Plus Jakarta Sans');
    });
  });

  describe('src/styles/globals.css', () => {
    let source: string;

    beforeAll(() => {
      source = readFileSync(GLOBALS_CSS_PATH, 'utf8');
    });

    it('still loads the three Tailwind directives', () => {
      expect(source).toMatch(/@tailwind\s+base/);
      expect(source).toMatch(/@tailwind\s+components/);
      expect(source).toMatch(/@tailwind\s+utilities/);
    });

    it('defines the .glass-card utility', () => {
      expect(source).toMatch(/\.glass-card\s*\{/);
    });

    it('glass-card uses a translucent white background', () => {
      expect(source).toMatch(/background:\s*rgba\(255,\s*255,\s*255/);
    });

    it('glass-card applies a backdrop-blur', () => {
      expect(source).toMatch(/backdrop-filter:\s*blur\(/);
    });

    it('glass-card declares the WebKit-prefixed backdrop-filter', () => {
      expect(source).toMatch(/-webkit-backdrop-filter:\s*blur\(/);
    });

    it('declares a hover variant for the glass card', () => {
      expect(source).toMatch(/\.glass-card:hover\s*\{/);
    });

    it('defines a .gold-border utility for hairline gold accents', () => {
      expect(source).toMatch(/\.gold-border\s*\{/);
    });
  });

  describe('compiled utility output (token -> CSS chain)', () => {
    let compiled: string;
    let tmpDir: string;

    beforeAll(async () => {
      // Tailwind's JIT purges classes that don't appear in any content source.
      // We need a real content file (or `{ raw }` source) for the JIT to keep
      // the test classes. Easiest: drop a tiny HTML file in a temp dir and
      // point a content override at it. The postcss plugin in tailwind 3
      // reads `content` from the config only, so we mutate a deep clone of
      // the config for this test instead of touching the real file.
      tmpDir = mkdtempSync(join(tmpdir(), 'tw-glass-'));
      const fixture = join(tmpDir, 'fixture.html');
      writeFileSync(
        fixture,
        [
          '<div class="bg-primary text-secondary bg-surface bg-surface-container',
          ' border-surface-border font-serif font-sans backdrop-blur-glass',
          ' glass-card gold-border"></div>',
        ].join(' ')
      );

      const baseConfig = loadTailwindConfig();
      const testConfig = {
        ...baseConfig,
        content: [fixture],
        // Strip the safelist override so we prove the config-defined tokens
        // alone (no API surface) are sufficient to compile the utilities.
        safelist: undefined,
      };

      const inputCss = `
        @tailwind components;
        @tailwind utilities;
      `;

      const result = await postcss([tailwindcss(testConfig)]).process(
        inputCss,
        { from: undefined }
      );
      compiled = result.css;
    });

    afterAll(() => {
      if (tmpDir) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('emits a .bg-primary rule resolved to rgb(51 69 55 / ...)', () => {
      // Tailwind 3.4 emits colors as `rgb(R G B / var(--tw-*-opacity, 1))`
      // so opacity modifiers (bg-primary/50) work via CSS variables.
      expect(compiled).toMatch(
        /\.bg-primary\s*\{[^}]*background-color:\s*rgb\(\s*51\s+69\s+55\b/i
      );
    });

    it('emits a .text-secondary rule resolved to rgb(233 195 73 / ...)', () => {
      expect(compiled).toMatch(
        /\.text-secondary\s*\{[^}]*color:\s*rgb\(\s*233\s+195\s+73\b/i
      );
    });

    it('emits a .bg-surface rule resolved to rgb(244 251 242 / ...)', () => {
      expect(compiled).toMatch(
        /\.bg-surface\s*\{[^}]*background-color:\s*rgb\(\s*244\s+251\s+242\b/i
      );
    });

    it('emits a .bg-surface-container rule resolved to rgb(233 240 231 / ...)', () => {
      expect(compiled).toMatch(
        /\.bg-surface-container\s*\{[^}]*background-color:\s*rgb\(\s*233\s+240\s+231\b/i
      );
    });

    it('emits a .border-surface-border rule resolved to rgb(221 228 219 / ...)', () => {
      expect(compiled).toMatch(
        /\.border-surface-border\s*\{[^}]*border-color:\s*rgb\(\s*221\s+228\s+219\b/i
      );
    });

    it('emits a .font-serif rule referencing Playfair Display', () => {
      expect(compiled).toMatch(
        /\.font-serif\s*\{[^}]*font-family:[^}]*Playfair Display/i
      );
    });

    it('emits a .font-sans rule referencing Plus Jakarta Sans', () => {
      expect(compiled).toMatch(
        /\.font-sans\s*\{[^}]*font-family:[^}]*Plus Jakarta Sans/i
      );
    });

    it('emits a .backdrop-blur-glass rule with a 20px blur', () => {
      // Tailwind 3 emits backdrop-blur-* via a CSS variable; the variable
      // carries the actual `blur(20px)` value.
      expect(compiled).toMatch(
        /\.backdrop-blur-glass\s*\{[^}]*--tw-backdrop-blur:\s*blur\(20px\)/i
      );
    });
  });

  describe('production JSX token contract', () => {
    const COMPONENTS = [
      'src/components/landing/diario.tsx',
      'src/components/landing/glosario.tsx',
      'src/components/landing/metodos.tsx',
      'src/components/landing/olga.tsx',
    ];

    const OBSOLETE_TOKENS = [
      'text-coffee',
      'text-earth',
      'from-earth',
      'border-gold-soft',
      'bg-gold-soft/10',
      'text-on-primary',
    ];

    it.each(COMPONENTS)(
      '%s does not use obsolete design tokens',
      (relativePath) => {
        const source = readFileSync(resolve(ROOT, relativePath), 'utf8');
        for (const token of OBSOLETE_TOKENS) {
          expect(source).not.toContain(token);
        }
      }
    );
  });
});

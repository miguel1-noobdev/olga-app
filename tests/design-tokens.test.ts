import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig';
import type { Config } from 'tailwindcss';

const ROOT = resolve(__dirname, '..');
const TAILWIND_CONFIG_PATH = resolve(ROOT, 'tailwind.config.ts');
const GLOBALS_CSS_PATH = resolve(ROOT, 'src/styles/globals.css');

interface TailwindConfig {
  content?: Config['content'];
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

    it('extends theme.colors with the primary token as a CSS variable', () => {
      expect(config.theme.extend.colors.primary).toBe('var(--color-primary)');
    });

    it('extends theme.colors with the secondary token as a CSS variable', () => {
      expect(config.theme.extend.colors.secondary).toBe('var(--color-secondary)');
    });

    it('extends theme.colors with the surface token as a CSS variable', () => {
      expect(config.theme.extend.colors.surface).toBe('var(--color-surface)');
    });

    it('extends theme.colors with the surface container token as a CSS variable', () => {
      expect(config.theme.extend.colors['surface-container']).toBe(
        'var(--color-surface-container)'
      );
    });

    it('extends theme.colors with the surface border token as a CSS variable', () => {
      expect(config.theme.extend.colors['surface-border']).toBe('var(--color-surface-border)');
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
      resolved = resolveConfig(loadTailwindConfig() as Config);
    });

    it('resolves the primary color to the CSS variable', () => {
      // Tailwind normalizes `theme.extend.colors.primary` into `theme.colors.primary`
      expect(
        (resolved.theme?.colors as unknown as Record<string, string>).primary
      ).toBe('var(--color-primary)');
    });

    it('resolves the secondary color to the CSS variable', () => {
      expect(
        (resolved.theme?.colors as unknown as Record<string, string>).secondary
      ).toBe('var(--color-secondary)');
    });

    it('resolves the surface color to the CSS variable', () => {
      expect(
        (resolved.theme?.colors as unknown as Record<string, string>).surface
      ).toBe('var(--color-surface)');
    });

    it('resolves the surface-container color to the CSS variable', () => {
      expect(
        (resolved.theme?.colors as unknown as Record<string, string>)['surface-container']
      ).toBe('var(--color-surface-container)');
    });

    it('resolves the surface-border color to the CSS variable', () => {
      expect(
        (resolved.theme?.colors as unknown as Record<string, string>)['surface-border']
      ).toBe('var(--color-surface-border)');
    });

    it('resolves the serif font family to start with the CSS variable', () => {
      const serif = (resolved.theme?.fontFamily as unknown as Record<string, string[]>)
        .serif;
      expect(serif[0]).toBe('var(--font-serif)');
      expect(serif).toContain('Playfair Display');
    });

    it('resolves the sans font family to start with the CSS variable', () => {
      const sans = (resolved.theme?.fontFamily as unknown as Record<string, string[]>)
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

    it('declares default public palette values in :root', () => {
      const rootMatch = source.match(/:root\s*\{([^}]*)\}/s);
      expect(rootMatch).toBeTruthy();
      const root = rootMatch?.[1] ?? '';
      expect(root).toMatch(/--color-primary:\s*#334537/);
      expect(root).toMatch(/--color-secondary:\s*#e9c349/);
      expect(root).toMatch(/--color-surface:\s*#f4fbf2/);
      expect(root).toMatch(/--color-surface-container:\s*#e9f0e7/);
      expect(root).toMatch(/--color-surface-border:\s*#dde4db/);
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

    it('emits a .bg-primary rule referencing the CSS variable', () => {
      // Colors are opaque CSS variables so Tailwind emits them as-is.
      expect(compiled).toMatch(
        /\.bg-primary\s*\{[^}]*background-color:\s*var\(--color-primary\)/i
      );
    });

    it('emits a .text-secondary rule referencing the CSS variable', () => {
      expect(compiled).toMatch(
        /\.text-secondary\s*\{[^}]*color:\s*var\(--color-secondary\)/i
      );
    });

    it('emits a .bg-surface rule referencing the CSS variable', () => {
      expect(compiled).toMatch(
        /\.bg-surface\s*\{[^}]*background-color:\s*var\(--color-surface\)/i
      );
    });

    it('emits a .bg-surface-container rule referencing the CSS variable', () => {
      expect(compiled).toMatch(
        /\.bg-surface-container\s*\{[^}]*background-color:\s*var\(--color-surface-container\)/i
      );
    });

    it('emits a .border-surface-border rule referencing the CSS variable', () => {
      expect(compiled).toMatch(
        /\.border-surface-border\s*\{[^}]*border-color:\s*var\(--color-surface-border\)/i
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

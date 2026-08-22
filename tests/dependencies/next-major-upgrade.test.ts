import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
};

type Lockfile = {
  packages: Record<string, { version?: string }>;
};

const root = resolve(__dirname, '../..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8')
) as PackageManifest;
const lockfile = JSON.parse(
  readFileSync(resolve(root, 'package-lock.json'), 'utf8')
) as Lockfile;

describe('Next.js major upgrade contract', () => {
  it('uses the reviewed Next.js 16 and React 19 package set', () => {
    expect(manifest.dependencies.next).toBe('16.2.12');
    expect(manifest.dependencies.react).toBe('19.2.8');
    expect(manifest.dependencies['react-dom']).toBe('19.2.8');
    expect(manifest.dependencies['next-auth']).toBe('4.24.15');
  });

  it('keeps the test toolchain on compatible patched major releases', () => {
    expect(manifest.devDependencies.vitest).toBe('4.1.10');
    expect(manifest.devDependencies['@vitest/coverage-v8']).toBe('4.1.10');
    expect(manifest.devDependencies['@vitejs/plugin-react']).toBe('5.2.0');
    expect(manifest.devDependencies.vite).toBe('7.3.6');
    expect(manifest.devDependencies['happy-dom']).toBe('20.11.1');
  });

  it('pins the patched image optimizer dependency required by Next.js', () => {
    expect(manifest.overrides?.sharp).toBe('0.35.3');
    expect(lockfile.packages['node_modules/sharp']?.version).toBe('0.35.3');
  });

  it('uses the Next.js 16 proxy convention for protected routes', () => {
    const proxyPath = resolve(root, 'src/proxy.ts');
    expect(existsSync(proxyPath)).toBe(true);

    const source = readFileSync(proxyPath, 'utf8');
    expect(source).toMatch(/export (async )?function proxy\s*\(/);
    expect(source).toMatch(/export const config/);
    expect(source).toContain("'/blog/:path*'");
    expect(source).toContain("'/admin/:path*'");
  });

  it('migrates dynamic App Router APIs to promise-based params', () => {
    const dynamicFiles = [
      'src/app/blog/[slug]/page.tsx',
      'src/app/jardin-digital/[slug]/page.tsx',
      'src/app/laboratorio/plantas/[slug]/page.tsx',
      'src/app/laboratorio/lotes/nuevo/page.tsx',
      'src/app/admin/botanico/plantas/[id]/editar/page.tsx',
      'src/app/admin/botanico/aceites-extractos/[id]/editar/page.tsx',
      'src/app/admin/contenido/[id]/previsualizar/page.tsx',
      'src/app/api/admin/articles/[id]/route.ts',
      'src/app/api/admin/botanico/[catalog]/route.ts',
    ];

    for (const relativePath of dynamicFiles) {
      const source = readFileSync(resolve(root, relativePath), 'utf8');
      expect(source, relativePath).toMatch(/(?:params|searchParams):\s*Promise</);
      expect(source, relativePath).toMatch(/await (?:props\.)?(?:params|searchParams)/);
    }
  });
});

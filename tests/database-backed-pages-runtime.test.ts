import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appDirectory = resolve(process.cwd(), 'src/app');

function collectPageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) return collectPageFiles(path);
    return entry.name === 'page.tsx' ? [path] : [];
  });
}

describe('database-backed App Router pages', () => {
  it('classifies every direct database page as runtime and no unrelated page', () => {
    const pageFiles = collectPageFiles(appDirectory);
    const databaseBackedPages = pageFiles
      .filter((file) => readFileSync(file, 'utf8').includes('connectToDatabase'))
      .map((file) => relative(process.cwd(), file).replaceAll('\\', '/'))
      .sort();

    expect(databaseBackedPages).toEqual([
      'src/app/admin/botanico/aceites-extractos/[id]/editar/page.tsx',
      'src/app/admin/botanico/page.tsx',
      'src/app/admin/botanico/plantas/[id]/editar/page.tsx',
      'src/app/admin/contenido/[id]/previsualizar/page.tsx',
      'src/app/admin/contenido/page.tsx',
      'src/app/admin/usuarios/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/app/blog/articulos/page.tsx',
      'src/app/blog/page.tsx',
      'src/app/jardin-digital/[slug]/page.tsx',
      'src/app/jardin-digital/page.tsx',
      'src/app/laboratorio/aceites/[slug]/page.tsx',
      'src/app/laboratorio/aceites/page.tsx',
      'src/app/laboratorio/formulas/[id]/edit/page.tsx',
      'src/app/laboratorio/formulas/[id]/lotes/[lotId]/edit/page.tsx',
      'src/app/laboratorio/formulas/[id]/lotes/[lotId]/page.tsx',
      'src/app/laboratorio/formulas/[id]/lotes/nuevo/page.tsx',
      'src/app/laboratorio/formulas/[id]/page.tsx',
      'src/app/laboratorio/formulas/page.tsx',
      'src/app/laboratorio/lotes/[lotId]/editar/page.tsx',
      'src/app/laboratorio/lotes/[lotId]/page.tsx',
      'src/app/laboratorio/lotes/nuevo/page.tsx',
      'src/app/laboratorio/lotes/page.tsx',
      'src/app/laboratorio/plantas/[slug]/page.tsx',
      'src/app/laboratorio/plantas/page.tsx',
      'src/app/page.tsx',
    ]);

    for (const file of pageFiles) {
      const source = readFileSync(file, 'utf8');
      const isDatabaseBacked = source.includes('connectToDatabase');
      const isRuntime = source.includes("export const dynamic = 'force-dynamic'");

      expect(isRuntime, relative(process.cwd(), file)).toBe(isDatabaseBacked);
    }
  });
});

import { readFileSync } from 'node:fs';
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

describe('reviewed dependency policy', () => {
  it('keeps the reviewed framework and authentication releases', () => {
    expect(manifest.dependencies.next).toBe('16.2.12');
    expect(manifest.dependencies['next-auth']).toBe('4.24.15');
    expect(manifest.devDependencies.postcss).toBe('8.5.24');
    expect(manifest.overrides).toEqual({ postcss: '8.5.24', sharp: '0.35.3' });
  });

  it('locks the patched authentication and nested CSS dependencies', () => {
    expect(lockfile.packages['node_modules/next-auth']?.version).toBe('4.24.15');
    expect(lockfile.packages['node_modules/uuid']?.version).toBe('11.1.1');
    expect(lockfile.packages['node_modules/postcss']?.version).toBe('8.5.24');
    const postcssVersions = Object.entries(lockfile.packages)
      .filter(([packagePath]) => packagePath.endsWith('/postcss'))
      .map(([, packageInfo]) => packageInfo.version);
    expect(postcssVersions).toEqual(['8.5.24']);
  });
});

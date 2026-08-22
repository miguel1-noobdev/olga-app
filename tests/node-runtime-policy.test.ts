import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const reviewedNodeTypesVersion = '24.13.3';
const runtimeDocuments = [
  'README.md',
  'docs/runbook.md',
  'openspec/changes/direct-production-deployment/tasks.md',
];

function projectPath(path: string): string {
  return resolve(root, path);
}

function readProjectFile(path: string): string {
  const filePath = projectPath(path);
  const exists = existsSync(filePath);

  expect(exists, `${path} must exist`).toBe(true);
  return exists ? readFileSync(filePath, 'utf8') : '';
}

function effectiveEngineStrict(npmrc: string): string | undefined {
  let setting: string | undefined;

  for (const rawLine of npmrc.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#') || line.startsWith(';')) {
      continue;
    }

    const match = line.match(/^engine-strict\s*=\s*(?<value>[^\s#;]+)\s*$/i);
    if (match?.groups?.value) {
      setting = match.groups.value.toLowerCase();
    }
  }

  return setting;
}

function hasNode20InstallationInstruction(document: string): boolean {
  return /\b(?:install(?:ation)?|requirements?)\b(?:[^\n]*\n){0,4}[^\n]*\bnode(?:\.js)?\s+20\b|\bnode(?:\.js)?\s+20\b[^\n]*\binstall(?:ation)?\b/i.test(
    document
  );
}

describe('Node runtime policy', () => {
  it('uses .nvmrc as the only root runtime version selector', () => {
    const nvmrc = projectPath('.nvmrc');

    expect(existsSync(nvmrc), '.nvmrc must exist').toBe(true);
    if (existsSync(nvmrc)) {
      expect(readFileSync(nvmrc, 'utf8').trim()).toBe('24');
    }
    expect(existsSync(projectPath('.node-version'))).toBe(false);
    expect(existsSync(projectPath('.tool-versions'))).toBe(false);
  });

  it('declares the reviewed Node 24 engine and type definitions in manifest metadata', () => {
    const manifest = JSON.parse(readProjectFile('package.json')) as {
      devDependencies?: Record<string, string>;
      engines?: Record<string, string>;
    };
    const lockfile = JSON.parse(readProjectFile('package-lock.json')) as {
      packages?: Record<
        string,
        { devDependencies?: Record<string, string>; engines?: Record<string, string> }
      >;
    };
    const rootLockMetadata = lockfile.packages?.[''];

    expect(manifest.engines?.node).toBe('24.x');
    expect(rootLockMetadata?.engines?.node).toBe('24.x');
    expect(manifest.devDependencies?.['@types/node']).toBe(reviewedNodeTypesVersion);
    expect(rootLockMetadata?.devDependencies?.['@types/node']).toBe(reviewedNodeTypesVersion);
  });

  it('configures CI to select Node from .nvmrc with v5 actions', () => {
    const workflow = readProjectFile('.github/workflows/ci.yml');

    expect(workflow.match(/uses:\s*actions\/checkout@[^\s]+/g)).toEqual([
      'uses: actions/checkout@v5',
    ]);
    expect(workflow.match(/uses:\s*actions\/setup-node@[^\s]+/g)).toEqual([
      'uses: actions/setup-node@v5',
    ]);
    expect(workflow).toMatch(/^\s*node-version-file:\s*\.nvmrc\s*$/m);
    expect(workflow).not.toMatch(/^\s*node-version:\s*['"]?\d/m);
  });

  it('enforces package engine compatibility through npm', () => {
    expect(effectiveEngineStrict(readProjectFile('.npmrc'))).toBe('true');
  });

  it.each(runtimeDocuments)(
    '%s identifies Node.js 24 LTS without retaining a Node 20 installation instruction',
    (path) => {
      const document = readProjectFile(path);

      expect(document).toMatch(/\bnode\.js\s+24\s+lts\b/i);
      expect(hasNode20InstallationInstruction(document)).toBe(false);
    }
  );
});

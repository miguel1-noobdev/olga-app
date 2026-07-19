import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const privilegedDocuments = ['README.md', 'docs/runbook.md', 'docs/scripts.md'];

function readProjectFile(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('privileged script policy', () => {
  it('documents tsx and the zsh silent password prompt without inline password assignments', () => {
    const documents = privilegedDocuments.map(readProjectFile);
    const documentation = documents.join('\n');
    const scriptsDocumentation = readProjectFile('docs/scripts.md');

    expect(documentation).not.toContain('ts-node');
    expect(scriptsDocumentation).toContain("read -r -s 'ADMIN_PASSWORD?Admin password: '");
    expect(scriptsDocumentation).toContain('npx tsx scripts/create-admin.ts');
    expect(scriptsDocumentation).toContain('npx tsx scripts/reset-password.ts');
    expect(documentation).not.toMatch(/(?:^|\n)\s*(?:export\s+)?[A-Z_]*PASSWORD\s*=/m);
  });

  it('does not track legacy scripts with fixed privileged credentials', () => {
    expect(existsSync(resolve(root, 'scripts/create-test-user.ts'))).toBe(false);
    expect(existsSync(resolve(root, 'scripts/test-login.ts'))).toBe(false);
  });

  it('does not document the removed legacy scripts', () => {
    const documentation = privilegedDocuments.map(readProjectFile).join('\n');

    expect(documentation).not.toContain('create-test-user.ts');
    expect(documentation).not.toContain('test-login.ts');
  });
});

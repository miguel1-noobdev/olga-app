import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const connectSource = readProjectFile('src/lib/db/connect.ts');
const compose = readProjectFile('docker-compose.yml');
const envExample = readProjectFile('.env.example');
const runbook = readProjectFile('docs/runbook.md');
const scriptsDocumentation = readProjectFile('docs/scripts.md');

describe('Block 11 MongoDB contract', () => {
  it('keeps the application configuration free of a hardcoded localhost fallback', () => {
    expect(connectSource).not.toContain('localhost:27017');
    expect(connectSource).toContain('MONGODB_URI must be set to a valid MongoDB connection URI.');
  });

  it.each([
    'scripts/check-articles.ts',
    'scripts/check-users.ts',
    'scripts/seed-articles.ts',
    'scripts/seed-oils.ts',
    'scripts/seed-plants.ts',
  ])(
    'routes %s through the shared connection contract without a URI fallback',
    (path) => {
      const script = readProjectFile(path);

      expect(script).toContain('connectToDatabase');
      expect(script).not.toContain('mongodb://localhost:27017/botanica-ob');
      expect(script).not.toMatch(/process\.env\.MONGODB_URI\s*\|\|/);
    }
  );

  it.each([
    'scripts/check-articles.ts',
    'scripts/check-users.ts',
    'scripts/seed-articles.ts',
    'scripts/seed-oils.ts',
    'scripts/seed-plants.ts',
  ])(
    'does not log URIs, credentials, or raw Mongo errors in %s',
    (path) => {
      const script = readProjectFile(path);

      expect(script).not.toMatch(/console\.(log|error)\([^\n]*(?:MONGODB_URI|mongodb(?:\+srv)?:\/\/|passwordHash|password)/i);
      expect(script).not.toMatch(/console\.error\([^\n]*,\s*(?:error|String\(error\))/i);
      expect(script).not.toMatch(/console\.error\(\s*(?:err|error)\b/i);
    }
  );

  it('requires substituted local Mongo authentication while keeping the host bind on loopback', () => {
    expect(compose).toContain('127.0.0.1:27017:27017');
    expect(compose).toContain('MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME:?');
    expect(compose).toContain('MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD:?');
    expect(compose).not.toMatch(/MONGO_INITDB_ROOT_PASSWORD:\s+[^$\s][^\n]*/);
    expect(envExample).toContain('MONGO_INITDB_ROOT_USERNAME=');
    expect(envExample).toContain('MONGO_INITDB_ROOT_PASSWORD=');
    expect(envExample).toContain('authSource=admin');
  });

  it('documents the separated Mongo deployment contracts and migration precautions', () => {
    for (const document of [runbook, scriptsDocumentation]) {
      expect(document).toContain('authenticated');
      expect(document).toContain('authSource');
      expect(document).toContain('URL-encod');
      expect(document).toContain('backup');
      expect(document).toContain('lease lock');
      expect(document).toContain('rollback');
    }

    expect(runbook).toContain('Coolify');
    expect(runbook).toContain('managed MongoDB');
    expect(runbook).toContain('replica set alone');
    expect(runbook).toMatch(/do not assume/i);
    expect(scriptsDocumentation).toContain('Coolify');
    expect(scriptsDocumentation).toContain('external managed MongoDB');
  });
});

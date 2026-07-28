import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSafeScriptTarget } from '../../scripts/safe-target';

const validTestTarget = {
  SCRIPT_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/botanica-ob-test',
};

describe('safe script targets', () => {
  it('rejects an unknown execution environment before a writer can run', () => {
    let writes = 0;

    expect(() => {
      const target = readSafeScriptTarget({
        ...validTestTarget,
        SCRIPT_ENV: 'staging',
      });
      writes += target.databaseName.length;
    }).toThrow('Script configuration error: SCRIPT_ENV must be one of development, test, or production.');

    expect(writes).toBe(0);
  });

  it('rejects an unsafe database target before a writer can run', () => {
    let writes = 0;

    expect(() => {
      const target = readSafeScriptTarget({
        ...validTestTarget,
        MONGODB_URI: 'mongodb://127.0.0.1:27017/other-database',
      });
      writes += target.databaseName.length;
    }).toThrow('Script configuration error: database target is not allowlisted for this environment.');

    expect(writes).toBe(0);
  });

  it('rejects a remote or otherwise unknown database host', () => {
    expect(() => readSafeScriptTarget({
      ...validTestTarget,
      MONGODB_URI: 'mongodb://db.example.test:27017/botanica-ob-test',
    })).toThrow('Script configuration error: MongoDB host is not allowlisted.');
  });

  it('accepts the disposable test database target and returns its parsed identity', () => {
    expect(readSafeScriptTarget(validTestTarget)).toEqual({
      environment: 'test',
      databaseName: 'botanica-ob-test',
      MONGODB_URI: validTestTarget.MONGODB_URI,
    });
  });

  it('rejects an unauthenticated production target', () => {
    expect(() => readSafeScriptTarget({
      SCRIPT_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/botanica-ob',
    })).toThrow('Script configuration error: production MongoDB target must be authenticated.');
  });

  it('accepts an authenticated production target', () => {
    expect(readSafeScriptTarget({
      SCRIPT_ENV: 'production',
      MONGODB_URI: 'mongodb://operator:password@127.0.0.1:27017/botanica-ob?authSource=admin',
    }).databaseName).toBe('botanica-ob');
  });

  it('guards every creation and seed entrypoint before its database operation', () => {
    const scripts = [
      'create-admin.ts',
      'create-productora.ts',
      'reset-password.ts',
      'seed-articles.ts',
      'seed-oils.ts',
      'seed-plants.ts',
    ] as const;

    const operationMarkers: Record<(typeof scripts)[number], string> = {
      'create-admin.ts': 'new UserModel',
      'create-productora.ts': 'UserModel.create',
      'reset-password.ts': 'UserModel.updateOne',
      'seed-articles.ts': 'repo.create',
      'seed-oils.ts': 'await upsertOilSeed',
      'seed-plants.ts': 'findOneAndUpdate',
    };

    for (const script of scripts) {
      const source = readFileSync(resolve(process.cwd(), 'scripts', script), 'utf8');
      const guardMarker = ['create-admin.ts', 'reset-password.ts'].includes(script)
        ? 'readAdminProvisioningEnvironment'
        : 'readSafeScriptTarget';
      const guardIndex = source.indexOf(guardMarker);
      const operationIndex = source.indexOf(operationMarkers[script]);

      expect(guardIndex, `${script} must validate its target`).toBeGreaterThanOrEqual(0);
      expect(operationIndex, `${script} must have a database operation`).toBeGreaterThanOrEqual(0);
      expect(guardIndex, `${script} must guard before writing`).toBeLessThan(operationIndex);
    }
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(resolve(process.cwd(), 'scripts/create-productora.ts'), 'utf8');
const scriptsDocumentation = readFileSync(resolve(process.cwd(), 'docs/scripts.md'), 'utf8');
const runbook = readFileSync(resolve(process.cwd(), 'docs/runbook.md'), 'utf8');

describe('productora provisioning script hardening', () => {
  it('uses validated environment input and bounded MongoDB connection timeouts', () => {
    expect(script).toContain("readProductoraProvisioningEnvironment()");
    expect(script).toContain('serverSelectionTimeoutMS: 5000');
    expect(script).toContain('connectTimeoutMS: 5000');
    expect(script).not.toContain('mongodb://localhost:27017/botanica-ob');
    expect(script.indexOf('readProductoraProvisioningEnvironment()')).toBeLessThan(
      script.indexOf('mongoose.connect')
    );
  });

  it('guarantees disconnect in a finally block and never prints secrets or hash material', () => {
    expect(script).toContain('finally');
    expect(script).toContain('await mongoose.disconnect()');
    expect(script).not.toMatch(/console\.(log|error)\([^\n]*(?:password|passwordHash|hash)/i);
    expect(script).not.toContain('console.log(\'Email:\'');
  });

  it('explicitly recovers or creates Olga as an active productora account', () => {
    expect(script).toContain('applyProductoraAccountRecovery(existingUser, passwordHash)');
    expect(script).toContain('createProductoraAccountRecoveryUpdate(passwordHash)');
  });

  it('documents the required Olga provisioning contract and keeps Block 5B separate', () => {
    expect(scriptsDocumentation).toContain('`MONGODB_URI`');
    expect(scriptsDocumentation).toContain('`OLGA_EMAIL`');
    expect(scriptsDocumentation).toContain('`OLGA_PASSWORD`');
    expect(scriptsDocumentation).toContain('shorter than 12 characters');
    expect(scriptsDocumentation).toContain('active `productora` role');
    expect(runbook).toContain('Productora provisioning');
    expect(runbook).toContain('Block 5B');
  });
});

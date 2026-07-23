import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const scripts = ['scripts/create-admin.ts', 'scripts/reset-password.ts'];
const resetPasswordScript = readFileSync(resolve(process.cwd(), 'scripts/reset-password.ts'), 'utf8');

describe('privileged admin script hardening', () => {
  it.each(scripts)('%s uses bounded MongoDB connection timeouts', (path) => {
    const script = readFileSync(resolve(process.cwd(), path), 'utf8');

    expect(script).toContain('serverSelectionTimeoutMS: 5000');
    expect(script).toContain('connectTimeoutMS: 5000');
    expect(script).toContain('socketTimeoutMS: 10000');
  });

  it.each(scripts)('%s always disconnects in finally', (path) => {
    const script = readFileSync(resolve(process.cwd(), path), 'utf8');
    const finallyPosition = script.indexOf('finally');
    const disconnectPosition = script.indexOf('await mongoose.disconnect()');

    expect(finallyPosition).toBeGreaterThanOrEqual(0);
    expect(disconnectPosition).toBeGreaterThan(finallyPosition);
  });

  it.each(scripts)('%s does not print credentials or hash material', (path) => {
    const script = readFileSync(resolve(process.cwd(), path), 'utf8');
    const outputCalls = script.match(/console\.(log|error)\([^\n]*/g) ?? [];

    expect(outputCalls).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/(?:ADMIN_PASSWORD|ADMIN_EMAIL|passwordHash|bcrypt|hash\()/i),
    ]));
  });

  it('fails safely when reset-password finds no designated admin account', () => {
    expect(resetPasswordScript).toContain('result.matchedCount === 0');
    expect(resetPasswordScript).toContain('No administrator account matched the designated email.');
    expect(resetPasswordScript).toContain('process.exitCode = 1');
  });
});

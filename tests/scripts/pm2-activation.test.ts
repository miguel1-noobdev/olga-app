import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'ops/scripts/activate-pm2-release.sh');
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function run(...arguments_: string[]) {
  return spawnSync('bash', [scriptPath, ...arguments_], { encoding: 'utf8' });
}

describe('PM2 release activation script', () => {
  it('is valid executable shell and requires a caller-supplied immutable release SHA', () => {
    const syntax = spawnSync('bash', ['-n', scriptPath], { encoding: 'utf8' });
    const source = readFileSync(scriptPath, 'utf8');

    expect(syntax.status).toBe(0);
    expect(statSync(scriptPath).mode & 0o777).toBe(0o755);
    expect(source).toContain('#!/usr/bin/env bash');
    expect(source).toContain('readonly RELEASE_ID="${1:-}"');
    expect(source).not.toContain('b050790d8dc7ab9638dd74217c18cd770043401f');
    expect(source).toContain('RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"');
    expect(source).toContain('CURRENT_LINK="$APP_ROOT/current"');
    expect(source).toContain('SECRETS_FILE="/etc/botanica-ob/secrets.env"');

    for (const arguments_ of [[], ['not-a-sha'], ['A'.repeat(40)]]) {
      const result = run(...arguments_);

      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('A full 40-character lowercase Git SHA is required.');
    }

    const validSha = run(releaseSha);

    expect(validSha.status, validSha.stderr).toBe(1);
    expect(validSha.stderr).toContain(`Prepared immutable release is unavailable: ${releaseSha}`);
  });

  it('sources root-only secrets silently and accepts the established Mongo variable names', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('[[ "$(id -u)" == "0" ]]');
    expect(source).toContain('[[ "$(stat -c \'%u\' "$SECRETS_FILE")" == "0" ]]');
    expect(source).toContain('[[ "$(stat -c \'%a\' "$SECRETS_FILE")" == "600" ]]');
    expect(source).toContain('. "$SECRETS_FILE" >/dev/null 2>&1');

    for (const variable of [
      'MONGO_INITDB_ROOT_USERNAME',
      'MONGO_INITDB_ROOT_PASSWORD',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'INTERNAL_ACCOUNT_CHECK_ORIGIN',
    ]) {
      expect(source).toContain(variable);
    }

    expect(source).toContain('[[ -n ${!required_var:-} ]]');
    expect(source).toContain('MONGODB_URI="mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@127.0.0.1:27017/botanica-ob?authSource=admin"');
    expect(source).not.toMatch(
      /printf[^\n]*(MONGO_INITDB_ROOT_USERNAME|MONGO_INITDB_ROOT_PASSWORD|MONGODB_URI|NEXTAUTH_SECRET|NEXTAUTH_URL|INTERNAL_ACCOUNT_CHECK_ORIGIN)/,
    );
  });

  it('switches current atomically and rolls PM2 and current back on failure', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('trap rollback EXIT');
    expect(source).toContain('ln -s "$RELEASE_DIR" "$current_tmp"');
    expect(source).toContain('mv -Tf "$current_tmp" "$CURRENT_LINK"');
    expect(source).toContain('run_pm2 delete "$PM2_APP"');
    expect(source).toContain('mv -Tf "$restore_tmp" "$CURRENT_LINK"');
    expect(source).toContain('run_pm2 start "$CURRENT_LINK/ops/pm2/ecosystem.config.cjs"');
  });

  it('runs PM2 as migue and waits within a bounded loopback readiness window', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('RUN_AS="migue"');
    expect(source).toContain('runuser --preserve-environment --user "$RUN_AS" -- pm2');
    expect(source).toContain('HEALTH_URL="http://127.0.0.1:3000/api/health"');
    expect(source).toContain('readonly HEALTH_TIMEOUT_SECONDS=30');
    expect(source).toContain('readonly HEALTH_RETRY_INTERVAL_SECONDS=1');
    expect(source).toContain('health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))');
    expect(source).toContain(
      'until health_status="$(curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out \'%{http_code}\' "$HEALTH_URL")" && [[ "$health_status" == "200" ]]; do',
    );
    expect(source).toContain('if (( SECONDS >= health_deadline )); then');
    expect(source).toContain('sleep "$HEALTH_RETRY_INTERVAL_SECONDS"');
    expect(source).toContain("die 'Loopback health check failed before readiness deadline.'");
    expect(source).not.toContain(
      'health_status="$(curl --fail --silent --show-error --max-time 5 --output /dev/null --write-out \'%{http_code}\' "$HEALTH_URL")"\nif ! [[ "$health_status" == "200" ]]',
    );
  });
});

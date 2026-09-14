import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/node24-systemd-rehearsal.yml'), 'utf8');
const runbook = readFileSync(resolve(process.cwd(), 'docs/runbook.md'), 'utf8');

function position(fragment: string) {
  const index = workflow.indexOf(fragment);
  expect(index, `missing workflow fragment: ${fragment}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe('GitHub-hosted Node 24 systemd rehearsal', () => {
  it('runs every scenario on a fresh Ubuntu 24.04 VM', () => {
    expect(workflow).toContain('runs-on: ubuntu-24.04');
    expect(workflow).toContain('github.event.pull_request.head.repo.full_name == github.repository');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('scenario: [positive, health-failure, interruption]');
    expect(workflow).toContain('branches: [test/issue-71-node24-systemd-rehearsal]');
    expect(workflow).toContain('workflow_dispatch:');
  });

  it('proves the systemd PID 1 and non-container environment before provisioning', () => {
    const environment = position('ps -p 1 -o comm=');
    const virtualization = position('systemd-detect-virt --vm');
    const provisioning = position('name: Provision isolated rehearsal resources');

    expect(environment).toBeLessThan(provisioning);
    expect(virtualization).toBeLessThan(provisioning);
    expect(workflow).toContain('[[ "$pid1" == systemd ]]');
  });

  it('pins both Node distributions and PM2 without using ambient PATH at runtime', () => {
    expect(workflow).toContain('node-version: 20.20.2');
    expect(workflow).toContain('node-version: 24.21.0');
    expect(workflow).toContain('pm2@5.4.3');
    expect(workflow).toContain('require(process.argv[1]).version');
    expect(workflow).not.toContain('$NODE20_BIN $NODE20_PM2_CLI --version');
    expect(workflow).not.toContain('$NODE24_BIN $NODE24_PM2_CLI --version');
    expect(workflow).toContain('install -o root -g botanica-runtime -m 640 "$RUNNER_TEMP/node24-runtime.conf"');
    expect(workflow).toContain('chmod -R a-w /opt/botanica-runtimes');
    expect(workflow).not.toContain('chmod -R go-w /opt/botanica-runtimes');
    expect(workflow).toContain('NODE20_BIN: /opt/botanica-runtimes/node20/bin/node');
    expect(workflow).toContain('NODE24_BIN: /opt/botanica-runtimes/node24/bin/node');
  });

  it('loads the root-only secret file inside the privileged baseline boundary', () => {
    expect(workflow).toContain("sudo env NODE20_BIN=\"$NODE20_BIN\" NODE20_PM2_CLI=\"$NODE20_PM2_CLI\" /bin/bash <<'BASH'");
    expect(position('/bin/bash <<\'BASH\'')).toBeLessThan(position('source /etc/botanica-ob/secrets.env'));
    expect(position('cd "$pm2_home"')).toBeLessThan(position('/usr/sbin/runuser'));
  });

  it('uses an isolated Mongo service and the real release boundary', () => {
    expect(workflow).toContain('image: mongo:8.0');
    expect(position('ops/scripts/handoff-release.sh')).toBeLessThan(position('ops/scripts/node24-systemd-rehearsal.sh'));
    expect(workflow).toContain('REMOTE_HOST="botanica-deploy@localhost"');
    expect(workflow).not.toContain('botanicaob.duckdns.org');
  });

  it('publishes only the sanitized receipt as named live evidence', () => {
    expect(workflow).toContain('Ubuntu systemd Node24/Node20 cutover rehearsal');
    expect(workflow).toContain('path: ${{ runner.temp }}/node24-systemd-receipt.txt');
    expect(workflow).toContain('final_cwd_identity=true health=200 rollback_result=');
    expect(workflow).not.toContain('final_cwd_identity=true .* health=200');
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).not.toMatch(/path:.*(?:child|log)/);
  });

  it('documents the evidence boundary without authorizing production', () => {
    expect(runbook).toContain('### GitHub-hosted Node runtime rehearsal');
    expect(runbook).toContain('Never substitute personal WSL or the production VPS');
    expect(runbook).toContain('node24-systemd-receipt-<scenario>');
    expect(runbook).toContain('does not authorize production deployment');
  });
});

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
    expect(workflow).toContain(`fromJSON(github.event_name == 'workflow_dispatch' && inputs.scenario_scope == 'recovery' && '["health-failure","interruption"]' || '["positive","health-failure","interruption"]')`);
    expect(workflow).toContain('branches: [test/issue-71-node24-systemd-rehearsal]');
    expect(workflow).toContain('workflow_dispatch:');
  });

  it.each([
    ['workflow_dispatch', 'recovery', 2], ['workflow_dispatch', 'all', 3],
    ['workflow_dispatch', '', 3], ['workflow_dispatch', 'other', 3], ['pull_request', 'recovery', 3],
  ])('selects the bounded matrix for %s/%s', (event, scope, count) => {
    expect(workflow).toMatch(/scenario_scope:\s+description:[^\n]+\s+type: choice\s+default: all\s+options: \[all, recovery\]/);
    const expression = workflow.match(/scenario: \$\{\{ fromJSON\((.+)\) \}\}/)?.[1];
    expect(expression).toBeDefined();
    const evaluate = new Function('event', 'scope', `return ${expression?.replace('github.event_name', 'event').replace('inputs.scenario_scope', 'scope')}`);
    const scenarios: string[] = JSON.parse(evaluate(event, scope));
    expect(scenarios).toEqual(count === 2 ? ['health-failure', 'interruption'] : ['positive', 'health-failure', 'interruption']);
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

  it('opts into legacy preparation only for the declared rollback baseline', () => {
    const baselineStart = position('- name: Prepare sealed Node 20 rollback release');
    const baselineEnd = position('- name: Start and verify Node 20 baseline');
    const candidateStart = position('- name: Run guarded cutover rehearsal');
    const candidateEnd = position('- name: Publish sanitized rehearsal receipt');
    const baselinePreparation = workflow.slice(baselineStart, baselineEnd);
    const candidatePreparation = workflow.slice(candidateStart, candidateEnd);

    expect(baselinePreparation).toContain('RELEASE_ROLE=legacy-baseline');
    expect(baselinePreparation).toContain('CANDIDATE_SHA="$CANDIDATE_SHA"');
    expect(baselinePreparation).toContain('ROLLBACK_SHA="$ROLLBACK_SHA"');
    expect(baselinePreparation).toContain('RELEASE_SHA="$ROLLBACK_SHA"');
    expect(candidatePreparation).not.toContain('RELEASE_ROLE');
    expect(workflow.match(/RELEASE_ROLE=/g)).toHaveLength(1);
  });

  it('loads the root-only secret file inside the privileged baseline boundary', () => {
    expect(workflow).toContain("sudo env NODE20_BIN=\"$NODE20_BIN\" NODE20_PM2_CLI=\"$NODE20_PM2_CLI\" /bin/bash <<'BASH'");
    expect(position('/bin/bash <<\'BASH\'')).toBeLessThan(position('source /etc/botanica-ob/secrets.env'));
    expect(position('cd "$pm2_home"')).toBeLessThan(position('/usr/sbin/runuser'));
    expect(workflow).toContain('(( healthy_responses >= 3 )) && break');
    expect(workflow).toContain('if (( healthy_responses < 3 )); then');
    expect(workflow).toContain('[[ "$(sudo readlink -f "/proc/$pid/exe")" == "$NODE20_BIN" ]]');
    expect(workflow).toContain('[[ "$(sudo readlink -f "/proc/$pid/cwd")" == "$APP_ROOT/releases/$ROLLBACK_SHA" ]]');
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
    expect(workflow).toContain('driver_status=0');
    expect(workflow).toContain('|| driver_status=$?');
    expect(position('cat "$RUNNER_TEMP/node24-systemd-receipt.txt"')).toBeLessThan(position('if (( driver_status != 0 )); then'));
    expect(workflow).toContain('exit "$driver_status"');
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).not.toMatch(/path:.*(?:child|log)/);
  });

  it('documents the evidence boundary without authorizing production', () => {
    expect(runbook).toContain('### GitHub-hosted Node runtime rehearsal');
    expect(runbook).toContain('Never substitute personal WSL or the production VPS');
    expect(runbook).toContain('node24-systemd-receipt-<scenario>');
    expect(runbook).toContain('| `interruption` | Only the activation shell receives TERM; its EXIT handler restores the declared Node 20 release/runtime. |');
    expect(runbook).toContain('does not authorize production deployment');
  });
});

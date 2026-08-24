import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const moduleName = 'ops.scripts.node24_migration_preparation_contract';
const script = resolve(process.cwd(), 'ops/scripts/node24-prepare-release.sh');

function run(source: string) {
  return spawnSync('/usr/bin/python3', ['-c', source], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
}

const setup = String.raw`
import copy, hashlib
from importlib import import_module
m = import_module(${JSON.stringify(moduleName)})
policy = import_module('ops.scripts.node24_migration_policy')
def sha(value): return hashlib.sha256(value).hexdigest()
def reject(action):
 try: action()
 except m.PreparationContractError as error:
  assert str(error) == 'invalid preparation contract'; return
 raise AssertionError('accepted')
def authorization():
 paths = {'checkpoint':'/var/lib/x/checkpoint.json','lock':'/var/lib/x/checkpoint.json.lock','artifacts':'/var/lib/x/artifacts','staging':'/var/lib/x/staging','app':'/srv/x','releases':'/srv/x/releases','current':'/srv/x/current','preparer':'/var/lib/x/staging/preparer'}
 value = {'schema':'botanica-ob.node24-migration-policy.v1','candidate_sha':'a'*40,'rollback_sha':'b'*40,'paths':paths,'ownership':dict.fromkeys(('artifact_uid','artifact_gid','staging_uid','staging_gid','release_uid','release_gid'),0),'modes':{'managed_root':493,'artifact':384,'private_workspace':448,'staged_bundle':384,'initial_release':493,'sealed_release':365},'limits':{'max_bundle_size':99,'max_total_size':199},'units':{'canonical':'x.service','authorized':['x.service']},'artifacts':{}}
 manifest = {'transaction_id':'node24-test','sequence':1,'stage':'manifest_validated','candidate_sha':'a'*40,'rollback_sha':'b'*40,'artifacts':{},'paths':{'checkpoint':paths['checkpoint'],'lock':paths['lock'],'runtime_staging':paths['staging'],'candidate_release':'/srv/x/releases/'+'a'*40,'rollback_release':'/srv/x/releases/'+'b'*40,'current_link':paths['current']},'units':value['units']}
 artifacts = [('node_target','24.19.0','amd64',[('libnode',b'lib'),('nodejs',b'node')]),('node_rollback','20.20.2','amd64',[('libnode',b'old'),('nodejs',b'back')]),('pm2','7.0.3','all',[('pm2',b'pm2')]),('source_release','a'*40,'all',[('source',b's')])]
 for kind, version, architecture, members in artifacts:
  closure = [{'identity':identity,'version':version,'architecture':architecture,'size':len(data),'digest':sha(data)} for identity,data in members]
  outer = b''.join(data for _,data in members)
  value['artifacts'][kind] = {'identity':'/var/lib/x/artifacts/'+kind,'digest':sha(outer),'size':len(outer),'version':version,'architecture':architecture,'closure':closure}
  manifest['artifacts'][kind] = {key:value['artifacts'][kind][key] for key in ('identity','digest')}
  if kind != 'source_release': manifest['artifacts'][kind].update(version=version, architecture=architecture)
 return policy.authorize_manifest(value, manifest), value, manifest
`;

const bundleCases = String.raw`
authorization_value, policy_value, manifest = authorization()
bundle = b'libnode'
records = m.validate_bundle(authorization_value, 'node_target', bundle)
assert [record.logical_name for record in records] == ['0000.deb', '0001.deb']
assert tuple(record.size for record in records) == (3, 4)
try: records[0].size = 9; raise AssertionError('mutable')
except AttributeError: pass
for bad in (b'lib', b'libnodex', b'nodelib'):
 reject(lambda bad=bad: m.validate_bundle(authorization_value, 'node_target', bad))
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['closure'][0]['digest'] = '0'*64
reject(lambda: m.validate_bundle(policy.authorize_manifest(changed, manifest), 'node_target', bundle))
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['digest'] = '0'*64
changed_manifest = copy.deepcopy(manifest); changed_manifest['artifacts']['node_target']['digest'] = '0'*64
reject(lambda: m.validate_bundle(policy.authorize_manifest(changed, changed_manifest), 'node_target', bundle))
reject(lambda: m.validate_bundle(authorization_value, 'source_release', b's'))
old = m._MAX_BUNDLE; m._MAX_BUNDLE = 6
reject(lambda: m.validate_bundle(authorization_value, 'node_target', bundle)); m._MAX_BUNDLE = old
old = m._MAX_MEMBERS; m._MAX_MEMBERS = 1
reject(lambda: m.validate_bundle(authorization_value, 'node_target', bundle)); m._MAX_MEMBERS = old
for bad in (policy.Authorization(authorization_value.transaction_id,b'',authorization_value.policy_bytes,authorization_value.policy_digest),policy.Authorization(authorization_value.transaction_id,authorization_value.manifest_bytes,b'x'*65537,authorization_value.policy_digest),policy.Authorization(authorization_value.transaction_id,authorization_value.manifest_bytes,b'{"schema":"x","schema":"x"}',authorization_value.policy_digest)):
 reject(lambda bad=bad: m.validate_bundle(bad, 'node_target', bundle))
`;

const checkpointCases = String.raw`
authorization_value, _, _ = authorization()
prepared = m.prepared_checkpoint(authorization_value)
assert m.preparation_status(authorization_value, authorization_value.manifest_bytes).sequence == 1
assert m.preparation_status(authorization_value, prepared).stage == 'prepared'
assert m.validate_prepared_checkpoint(authorization_value, prepared).stage == 'prepared'
for bad in (prepared+b' ', prepared.replace(b'prepared',b'unknown '), authorization_value.manifest_bytes.replace(b'node24-test',b'evil-test')):
 reject(lambda bad=bad: m.validate_prepared_checkpoint(authorization_value, bad))
source = m.authorized_source_release(authorization_value)
assert source.size == 1 and source.digest == sha(b's')
try: source.size = 9; raise AssertionError('mutable')
except AttributeError: pass
`;

describe('Node 24 migration preparation contract', () => {
  it('accepts only exact authorized concatenated closures', () => {
    const result = run(`${setup}\n${bundleCases}`);
    expect(result.status, result.stderr).toBe(0);
  });

  it('projects only the exact adjacent prepared checkpoint', () => {
    const result = run(`${setup}\n${checkpointCases}`);
    expect(result.status, result.stderr).toBe(0);
  });

  it('binds only the dedicated preparer source', () => {
    const source = `${setup}\nauthorization_value,_,_=authorization(); data=open(${JSON.stringify(script)},'rb').read(); assert m.validate_preparer(authorization_value,'ops/scripts/node24-prepare-release.sh',data).identity; reject(lambda:m.validate_preparer(authorization_value,'other',data)); reject(lambda:m.validate_preparer(authorization_value,'ops/scripts/node24-prepare-release.sh',data+b'x'))`;
    const result = run(source);
    expect(result.status, result.stderr).toBe(0);
    const shell = readFileSync(script, 'utf8');
    expect(shell).toContain('VERIFIED_NODE');
    expect(shell).toContain('VERIFIED_NPM_CLI');
    expect(shell).toContain('VERIFIED_SOURCE_DIGEST');
    expect(shell).toContain('PATH=$node_dir:/usr/bin:/bin');
    expect(shell).not.toMatch(/NODE_PATH|\b(eval|env|curl|wget|service|systemctl)\b|pm2\s+(?:start|stop|restart|reload)|current/);
    expect(shell.match(/(?:^|\n)\s*(?:[A-Za-z_][A-Za-z0-9_]*=)?(?:tar|stat|id|date|grep|chmod|dd|rm|sha256sum)\b/g)).toBeNull();
  });
});

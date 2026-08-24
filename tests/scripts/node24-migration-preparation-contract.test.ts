import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const moduleName = 'ops.scripts.node24_migration_preparation_contract';

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
def forged(changed, authorized):
 raw = policy._encode(changed)
 return policy.Authorization(authorized.transaction_id, authorized.manifest_bytes, raw, sha(raw))
def authorized_changed(changed, manifest):
 changed_manifest = copy.deepcopy(manifest)
 for kind, artifact in changed['artifacts'].items():
  fields = ('identity', 'digest') if kind == 'source_release' else ('identity', 'version', 'architecture', 'digest')
  changed_manifest['artifacts'][kind] = {field: artifact[field] for field in fields}
 return policy.authorize_manifest(changed, changed_manifest)
def authorization():
 paths = {'checkpoint':'/var/lib/x/checkpoint.json','lock':'/var/lib/x/checkpoint.json.lock','artifacts':'/var/lib/x/artifacts','staging':'/var/lib/x/staging','app':'/srv/x','releases':'/srv/x/releases','current':'/srv/x/current','preparer':'/var/lib/x/staging/preparer'}
 value = {'schema':'botanica-ob.node24-migration-policy.v1','candidate_sha':'a'*40,'rollback_sha':'b'*40,'paths':paths,'ownership':dict.fromkeys(('artifact_uid','artifact_gid','staging_uid','staging_gid','release_uid','release_gid'),0),'modes':{'managed_root':493,'artifact':384,'private_workspace':448,'staged_bundle':384,'initial_release':493,'sealed_release':365},'limits':{'max_bundle_size':2048,'max_total_size':4096},'units':{'canonical':'x.service','authorized':['x.service']},'artifacts':{}}
 manifest = {'transaction_id':'node24-test','sequence':1,'stage':'manifest_validated','candidate_sha':'a'*40,'rollback_sha':'b'*40,'artifacts':{},'paths':{'checkpoint':paths['checkpoint'],'lock':paths['lock'],'runtime_staging':paths['staging'],'candidate_release':'/srv/x/releases/'+'a'*40,'rollback_release':'/srv/x/releases/'+'b'*40,'current_link':paths['current']},'units':value['units']}
 artifacts = [('node_target','24.19.0','amd64','nodejs',b'node'),('node_rollback','20.20.2','amd64','nodejs',b'rollback'),('pm2','7.0.3','all','pm2',b'pm2'),('source_release','a'*40,'all','source',b'source')]
 for kind, version, architecture, identity, data in artifacts:
  closure = [{'identity':identity,'version':version,'architecture':architecture,'size':len(data),'digest':sha(data)}]
  value['artifacts'][kind] = {'identity':'/var/lib/x/artifacts/'+kind,'digest':sha(data),'size':len(data),'version':version,'architecture':architecture,'closure':closure}
  manifest['artifacts'][kind] = {key:value['artifacts'][kind][key] for key in ('identity','digest')}
  if kind != 'source_release': manifest['artifacts'][kind].update(version=version, architecture=architecture)
 return policy.authorize_manifest(value, manifest), value, manifest
`;

const profileCases = String.raw`
authorization_value, policy_value, manifest = authorization()
assert not hasattr(m, 'validate_bundle')
expected = {
 'node_target': ('node-v24.19.0-linux-x64.tar.xz', 'node-v24.19.0-linux-x64', 'nodejs', '24.19.0', 'amd64', b'node', 'xz'),
 'node_rollback': ('node-v20.20.2-linux-x64.tar.xz', 'node-v20.20.2-linux-x64', 'nodejs', '20.20.2', 'amd64', b'rollback', 'xz'),
 'pm2': ('pm2-7.0.3.tar.gz', 'pm2-7.0.3', 'pm2', '7.0.3', 'all', b'pm2', 'gzip'),
 'source_release': ('release-' + 'a'*40 + '.tar.gz', 'release-' + 'a'*40, 'source', 'a'*40, 'all', b'source', 'gzip'),
}
for kind, (filename, root, identity, version, architecture, data, compression) in expected.items():
 profile = m.validate_archive(authorization_value, kind, data)
 assert tuple(profile) == (kind, filename, root, identity, version, architecture, len(data), sha(data), compression)
 assert '/' not in profile.filename + profile.root_name
 try: profile.filename = 'mutable'; raise AssertionError('mutable')
 except AttributeError: pass
for bad in (b'', b'wrong', b'nodex'):
 reject(lambda bad=bad: m.validate_archive(authorization_value, 'node_target', bad))
reject(lambda: m.validate_archive(authorization_value, 'unknown', b'node'))
assert m._MAX_ARCHIVE == 512 * 1024**2
old = m._MAX_ARCHIVE; m._MAX_ARCHIVE = 3
reject(lambda: m.validate_archive(authorization_value, 'node_target', b'node')); m._MAX_ARCHIVE = old
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['closure'] = []
reject(lambda: m.validate_archive(forged(changed, authorization_value), 'node_target', b'node'))
changed = copy.deepcopy(policy_value); extra = dict(changed['artifacts']['node_target']['closure'][0], identity='libnode', size=3, digest=sha(b'lib'))
changed['artifacts']['node_target'].update(closure=[extra, changed['artifacts']['node_target']['closure'][0]], size=7, digest=sha(b'libnode'))
reject(lambda: m.validate_archive(authorized_changed(changed, manifest), 'node_target', b'libnode'))
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['closure'][0]['identity'] = 'libnode'
reject(lambda: m.validate_archive(forged(changed, authorization_value), 'node_target', b'node'))
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['closure'][0]['size'] = 5
reject(lambda: m.validate_archive(forged(changed, authorization_value), 'node_target', b'node'))
changed = copy.deepcopy(policy_value); changed['artifacts']['node_target']['closure'][0]['digest'] = '0'*64
reject(lambda: m.validate_archive(authorized_changed(changed, manifest), 'node_target', b'node'))
for bad in (
 policy.Authorization(authorization_value.transaction_id, b'', authorization_value.policy_bytes, authorization_value.policy_digest),
 policy.Authorization(authorization_value.transaction_id, authorization_value.manifest_bytes, b'x'*65537, authorization_value.policy_digest),
 policy.Authorization(authorization_value.transaction_id, authorization_value.manifest_bytes, b'{"schema":"x","schema":"x"}', authorization_value.policy_digest),
): reject(lambda bad=bad: m.validate_archive(bad, 'node_target', b'node'))
`;

const checkpointCases = String.raw`
authorization_value, _, _ = authorization()
prepared = m.prepared_checkpoint(authorization_value)
assert m.preparation_status(authorization_value, authorization_value.manifest_bytes).sequence == 1
assert m.preparation_status(authorization_value, prepared).stage == 'prepared'
assert m.validate_prepared_checkpoint(authorization_value, prepared).stage == 'prepared'
for bad in (prepared+b' ', prepared.replace(b'prepared',b'unknown '), authorization_value.manifest_bytes.replace(b'node24-test',b'evil-test')):
 reject(lambda bad=bad: m.validate_prepared_checkpoint(authorization_value, bad))
reject(lambda: m.preparation_status(authorization_value, prepared+b' '))
`;

describe('Node 24 migration preparation contract', () => {
  it('materializes only exact authorized archive profiles', () => {
    const result = run(`${setup}\n${profileCases}`);
    expect(result.status, result.stderr).toBe(0);
  });

  it('projects only the exact adjacent prepared checkpoint', () => {
    const result = run(`${setup}\n${checkpointCases}`);
    expect(result.status, result.stderr).toBe(0);
  });
});

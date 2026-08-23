import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const moduleName = 'ops.scripts.node24_migration_staging';
const bootstrap = `
import hashlib, json, os, stat, tempfile
from importlib import import_module
policy_module = import_module('ops.scripts.node24_migration_policy')
stage = import_module('${moduleName}')
def rejects(action):
  try:
    action()
  except stage.StagingError as error:
    assert type(error) is stage.StagingError
    assert str(error) == 'invalid migration staging'
    return
  raise AssertionError('expected generic rejection')
def digest(value):
  return hashlib.sha256(value).hexdigest()
def fixture():
  root = tempfile.mkdtemp()
  base, artifacts, staging = root + '/managed', root + '/managed/artifacts', root + '/managed/staging'
  os.makedirs(artifacts)
  os.mkdir(staging)
  for directory in (base, artifacts, staging):
    os.chmod(directory, 0o755)
  data = {'source_release': b'source-one', 'node_target': b'node-target', 'node_rollback': b'node-rollback', 'pm2': b'pm2-bundle'}
  names = {'source_release': 'source', 'node_target': 'node24', 'node_rollback': 'node20', 'pm2': 'pm2'}
  candidate, rollback = 'a' * 40, 'b' * 40
  versions = {'source_release': (candidate, 'all', 'source'), 'node_target': ('24.19.0', 'amd64', 'nodejs'), 'node_rollback': ('20.20.2', 'amd64', 'nodejs'), 'pm2': ('7.0.3', 'all', 'pm2')}
  items = {}
  for name, data_value in data.items():
    with open(artifacts + '/' + names[name], 'wb') as handle:
      handle.write(data_value)
    os.chmod(artifacts + '/' + names[name], 0o600)
    version, architecture, primary = versions[name]
    items[name] = {'identity': '/managed/artifacts/' + names[name], 'digest': digest(data_value), 'size': len(data_value), 'version': version, 'architecture': architecture, 'closure': [{'identity': primary, 'version': version, 'architecture': architecture, 'size': len(data_value), 'digest': digest(data_value)}]}
  uid, gid = os.geteuid(), os.getegid()
  policy = {'schema': 'botanica-ob.node24-migration-policy.v1', 'candidate_sha': candidate, 'rollback_sha': rollback, 'paths': {'checkpoint': '/managed/checkpoint', 'lock': '/managed/checkpoint.lock', 'artifacts': '/managed/artifacts', 'staging': '/managed/staging', 'app': '/app', 'releases': '/app/releases', 'current': '/app/current', 'preparer': '/managed/staging/preparer'}, 'ownership': {'artifact_uid': uid, 'artifact_gid': gid, 'staging_uid': uid, 'staging_gid': gid, 'release_uid': uid, 'release_gid': gid}, 'modes': {'managed_root': 0o755, 'artifact': 0o600, 'private_workspace': 0o700, 'staged_bundle': 0o600, 'initial_release': 0o755, 'sealed_release': 0o555}, 'limits': {'max_bundle_size': 40, 'max_total_size': 100}, 'units': {'canonical': 'botanica-ob.service', 'authorized': ['botanica-ob.service']}, 'artifacts': items}
  manifest = {'transaction_id': 'node24-migration-20260420-000001', 'sequence': 1, 'stage': 'manifest_validated', 'candidate_sha': candidate, 'rollback_sha': rollback, 'artifacts': {name: {key: value[key] for key in ('identity', 'digest', 'version', 'architecture') if name != 'source_release' or key in ('identity', 'digest')} for name, value in items.items()}, 'paths': {'checkpoint': '/managed/checkpoint', 'lock': '/managed/checkpoint.lock', 'runtime_staging': '/managed/staging', 'candidate_release': '/app/releases/' + candidate, 'rollback_release': '/app/releases/' + rollback, 'current_link': '/app/current'}, 'units': policy['units']}
  return root, artifacts, staging, policy, policy_module.authorize_manifest(policy, manifest)
`;

function check(source: string) {
  const result = spawnSync('python3', ['-B', '-c', `${bootstrap}\n${source}`], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  expect(result.status, result.stderr).toBe(0);
}
describe('Node 24 root-owned descriptor staging', () => {
  it('accepts exact authorization only and exposes no handoff API', () => check(`
root, artifacts, staging, policy, auth = fixture()
records = stage._stage_at(auth, root)
assert len(records) == 4
assert not any(value == root or isinstance(value, str) and value.startswith(root + '/') for record in records for value in record)
rejects(lambda: stage._stage_at(auth._replace(policy_digest='0' * 64), root))
rejects(lambda: stage._stage_at(auth._replace(manifest_bytes=auth.manifest_bytes.replace(b'manifest_validated', b'completed__________')), root))
assert not any(word in open(stage.__file__).read() for word in ('fchown', 'subprocess', 'getenv', 'handoff'))
`));
  it('guards public root and root staging ownership before private staging', () => check(`
root, artifacts, staging, policy, auth = fixture()
calls, original, saved_uid, saved_gid = [], stage._stage_at, stage.os.geteuid, stage.os.getegid
stage._stage_at = lambda *args: calls.append(args)
value = json.loads(auth.policy_bytes)
value['ownership']['staging_uid'] = value['ownership']['staging_gid'] = 0
guarded = policy_module.authorize_manifest(value, json.loads(auth.manifest_bytes))
for uid, gid, candidate in ((1, 0, guarded), (0, 1, guarded), (0, 0, auth)):
  stage.os.geteuid = lambda uid=uid: uid; stage.os.getegid = lambda gid=gid: gid
  rejects(lambda candidate=candidate: stage.stage_authorized_artifacts(candidate))
stage.os.geteuid = stage.os.getegid = lambda: 0
rejects(lambda: stage.stage_authorized_artifacts(guarded._replace(policy_bytes=b'{')))
stage._stage_at, stage.os.geteuid, stage.os.getegid = original, saved_uid, saved_gid
assert calls == []
`));
  it('rejects unsafe source metadata, traversal, and replacement races', () => check(`
for change in ('mode', 'link', 'size', 'digest', 'ancestor', 'symlink', 'type'):
  root, artifacts, staging, policy, auth = fixture()
  source = artifacts + '/source'
  if change == 'mode': os.chmod(source, 0o644)
  elif change == 'link': os.link(source, source + '-link')
  elif change == 'size': open(source, 'ab').write(b'x')
  elif change == 'digest': open(source, 'wb').write(b'wrong-data')
  elif change == 'ancestor': os.chmod(artifacts, 0o777)
  elif change == 'symlink':
    os.unlink(source)
    os.symlink('node24', source)
  else:
    os.unlink(source)
    os.mkdir(source)
  rejects(lambda: stage._stage_at(auth, root))
  assert not os.path.exists(staging + '/' + auth.transaction_id)
root, artifacts, staging, policy, auth = fixture()
original = stage._digest
def replace(*args):
  original(*args)
  os.unlink(artifacts + '/source')
  open(artifacts + '/source', 'wb').write(b'replaced!!')
  os.chmod(artifacts + '/source', 0o600)
stage._digest = replace
rejects(lambda: stage._stage_at(auth, root))
stage._digest = original
`));
  it('handles partial I/O and fsyncs the complete staging-owned inventory', () => check(`
root, artifacts, staging, policy, auth = fixture()
baseline, read, write, fsync, seen = len(os.listdir('/proc/self/fd')), stage.os.read, stage.os.write, stage.os.fsync, []
stage.os.read = lambda fd, size: read(fd, min(size, 2))
stage.os.write = lambda fd, data: write(fd, data[:2])
stage.os.fsync = lambda fd: (seen.append(fd), fsync(fd))[1]
records = stage._stage_at(auth, root)
stage.os.read, stage.os.write, stage.os.fsync = read, write, fsync
transaction = staging + '/' + auth.transaction_id
assert len(seen) >= len(records) + 2 and stat.S_IMODE(os.stat(transaction).st_mode) == 0o700
assert len(os.listdir('/proc/self/fd')) == baseline
`));
  it('preserves collisions and replacements while clean failures retry', () => check(`
root, artifacts, staging, policy, auth = fixture()
collision = staging + '/' + auth.transaction_id
os.mkdir(collision)
open(collision + '/keep', 'w').write('keep')
rejects(lambda: stage._stage_at(auth, root))
assert open(collision + '/keep').read() == 'keep'
root, artifacts, staging, policy, auth = fixture()
collision = staging + '/' + auth.transaction_id
original, changed = stage._verify_bundle, [False]
def replace(*args):
  original(*args)
  if not changed[0]:
    os.unlink(collision + '/node_rollback'); open(collision + '/node_rollback', 'wb').write(b'replacement'); os.chmod(collision + '/node_rollback', 0o600); changed[0] = True
stage._verify_bundle = replace
rejects(lambda: stage._stage_at(auth, root))
stage._verify_bundle = original
assert open(collision + '/node_rollback', 'rb').read() == b'replacement'
root, artifacts, staging, policy, auth = fixture()
baseline, original = len(os.listdir('/proc/self/fd')), stage._digest
stage._digest = lambda *args: (_ for _ in ()).throw(OSError())
rejects(lambda: stage._stage_at(auth, root))
stage._digest = original
assert not os.path.exists(staging + '/' + auth.transaction_id) and len(os.listdir('/proc/self/fd')) == baseline
root, artifacts, staging, policy, auth = fixture()
baseline, digest, close, target = len(os.listdir('/proc/self/fd')), stage._digest, stage.os.close, [False]
def fail_target(*args):
  digest(*args)
  if args[-1] is not None: target[0] = args[-1]
def fail_once(fd):
  if fd == target[0]: target[0] = None; raise OSError()
  return close(fd)
stage._digest, stage.os.close = fail_target, fail_once
rejects(lambda: stage._stage_at(auth, root))
stage._digest, stage.os.close = digest, close
assert target[0] is None and not os.path.exists(staging + '/' + auth.transaction_id) and len(os.listdir('/proc/self/fd')) == baseline
assert len(stage._stage_at(auth, root)) == 4
    `));
  it('fails closed on chmod and durability failures, then permits retry', () => check(`
for operation in ('fchmod', 'fsync'):
  root, artifacts, staging, policy, auth = fixture()
  saved, failed = getattr(stage.os, operation), [False]
  def fail_once(*args):
    if not failed[0]: failed[0] = True; raise OSError()
    return saved(*args)
  setattr(stage.os, operation, fail_once); rejects(lambda: stage._stage_at(auth, root)); setattr(stage.os, operation, saved)
  assert not os.path.exists(staging + '/' + auth.transaction_id) and len(stage._stage_at(auth, root)) == 4
root, artifacts, staging, policy, auth = fixture()
baseline, fstat, changed = len(os.listdir('/proc/self/fd')), stage.os.fstat, [False]
def fail_transaction(*args):
  value = verify(*args)
  if not changed[0]: changed[0], transaction = True, args[0]; stage.os.fstat = lambda fd: (_ for _ in ()).throw(OSError()) if fd == transaction else fstat(fd)
  return value
verify = stage._verify_bundle
stage._verify_bundle = fail_transaction
rejects(lambda: stage._stage_at(auth, root))
stage._verify_bundle, stage.os.fstat = verify, fstat; assert changed[0] and len(os.listdir('/proc/self/fd')) == baseline
`));
  it('rejects a canonical staging replacement and cleans only the original transaction', () => check(`
for kind in ('staging', 'transaction'):
  root, artifacts, staging, policy, auth = fixture()
  original, changed = stage._verify_bundle, [False]
  target = staging if kind == 'staging' else staging + '/' + auth.transaction_id
  def replace(*args):
    original(*args)
    if not changed[0]:
      os.rename(target, target + '-replaced'); os.mkdir(target); os.chmod(target, 0o755 if kind == 'staging' else 0o700); changed[0] = True
  stage._verify_bundle = replace
  rejects(lambda: stage._stage_at(auth, root))
  stage._verify_bundle = original
  if kind == 'staging': assert not os.path.exists(staging + '-replaced/' + auth.transaction_id)
  else: assert os.path.isdir(target) and os.path.isdir(target + '-replaced')
`));
});

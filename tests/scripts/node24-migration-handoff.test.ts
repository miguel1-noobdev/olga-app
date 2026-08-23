import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const bootstrap = `
import hashlib, json, os, stat, tempfile
from importlib import import_module
policy_module = import_module('ops.scripts.node24_migration_policy')
handoff = import_module('ops.scripts.node24_migration_handoff')
def rejects(action):
  try: action()
  except handoff.HandoffError as error:
    assert type(error) is handoff.HandoffError and str(error) == 'invalid migration handoff'; return
  raise AssertionError('expected generic rejection')
def digest(value): return hashlib.sha256(value).hexdigest()
def fixture(release=None):
  root = tempfile.mkdtemp(); base = root + '/managed'; artifacts, staging = base + '/artifacts', base + '/staging'
  os.makedirs(artifacts); os.mkdir(staging)
  for directory in (base, artifacts, staging): os.chmod(directory, 0o755)
  data = {'source_release': b'source-one', 'node_target': b'node-target', 'node_rollback': b'node-rollback', 'pm2': b'pm2-bundle'}
  files = {'source_release': 'source', 'node_target': 'node24', 'node_rollback': 'node20', 'pm2': 'pm2'}
  candidate, rollback, uid, gid = 'a'*40, 'b'*40, os.geteuid(), os.getegid()
  versions = {'source_release': (candidate, 'all', 'source'), 'node_target': ('24.19.0', 'amd64', 'nodejs'), 'node_rollback': ('20.20.2', 'amd64', 'nodejs'), 'pm2': ('7.0.3', 'all', 'pm2')}
  items = {}
  for name, value in data.items():
    open(artifacts + '/' + files[name], 'wb').write(value); os.chmod(artifacts + '/' + files[name], 0o600)
    version, architecture, primary = versions[name]
    items[name] = {'identity': '/managed/artifacts/' + files[name], 'digest': digest(value), 'size': len(value), 'version': version, 'architecture': architecture, 'closure': [{'identity': primary, 'version': version, 'architecture': architecture, 'size': len(value), 'digest': digest(value)}]}
  release = (uid, gid) if release is None else release
  policy = {'schema': 'botanica-ob.node24-migration-policy.v1', 'candidate_sha': candidate, 'rollback_sha': rollback, 'paths': {'checkpoint': '/managed/checkpoint', 'lock': '/managed/checkpoint.lock', 'artifacts': '/managed/artifacts', 'staging': '/managed/staging', 'app': '/app', 'releases': '/app/releases', 'current': '/app/current', 'preparer': '/managed/staging/preparer'}, 'ownership': {'artifact_uid': uid, 'artifact_gid': gid, 'staging_uid': uid, 'staging_gid': gid, 'release_uid': release[0], 'release_gid': release[1]}, 'modes': {'managed_root': 0o755, 'artifact': 0o600, 'private_workspace': 0o700, 'staged_bundle': 0o600, 'initial_release': 0o755, 'sealed_release': 0o555}, 'limits': {'max_bundle_size': 40, 'max_total_size': 100}, 'units': {'canonical': 'botanica-ob.service', 'authorized': ['botanica-ob.service']}, 'artifacts': items}
  manifest = {'transaction_id': 'node24-migration-20260420-000001', 'sequence': 1, 'stage': 'manifest_validated', 'candidate_sha': candidate, 'rollback_sha': rollback, 'artifacts': {name: {key: value[key] for key in ('identity', 'digest', 'version', 'architecture') if name != 'source_release' or key in ('identity', 'digest')} for name, value in items.items()}, 'paths': {'checkpoint': '/managed/checkpoint', 'lock': '/managed/checkpoint.lock', 'runtime_staging': '/managed/staging', 'candidate_release': '/app/releases/' + candidate, 'rollback_release': '/app/releases/' + rollback, 'current_link': '/app/current'}, 'units': policy['units']}
  auth = policy_module.authorize_manifest(policy, manifest)
  stage = import_module('ops.scripts.node24_migration_staging'); stage._stage_at(auth, root)
  return root, staging, policy, auth
def transaction(staging, auth): return staging + '/' + auth.transaction_id
`;
function check(source: string) {
  const result = spawnSync('python3', ['-B', '-c', `${bootstrap}\n${source}`], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  expect(result.status, result.stderr).toBe(0);
}
describe('Node 24 verified staging handoff', () => {
  it('guards the public boundary and authorization before filesystem activity', () => check(`
root, staging, policy, auth = fixture(); calls, open_ = [], handoff.os.open
handoff.os.open = lambda *a, **k: calls.append(a)
for uid, gid in ((1, 0), (0, 1)):
  handoff.os.geteuid = lambda uid=uid: uid; handoff.os.getegid = lambda gid=gid: gid; rejects(lambda: handoff.publish_verified_staging(auth))
value = json.loads(auth.policy_bytes); value['ownership']['staging_uid'] = value['ownership']['staging_gid'] = 0; root_auth = policy_module.authorize_manifest(value, json.loads(auth.manifest_bytes))
handoff.os.geteuid = handoff.os.getegid = lambda: 0; rejects(lambda: handoff.publish_verified_staging(auth)); rejects(lambda: handoff.publish_verified_staging(root_auth._replace(policy_bytes=b'{')))
handoff.os.open = open_; assert calls == []
`));
  it('rejects a non-exact, unstable staging inventory before handoff', () => check(`
for change in ('missing', 'extra', 'fifo', 'hardlink', 'mode', 'owner', 'digest'):
 root, staging, policy, auth = fixture(); path = transaction(staging, auth) + '/node_target'
 if change == 'missing': os.unlink(path)
 elif change == 'extra': open(transaction(staging, auth) + '/extra', 'wb').write(b'x')
 elif change == 'fifo': os.unlink(path); os.mkfifo(path, 0o600)
 elif change == 'hardlink': os.link(path, path + '-link')
 elif change == 'mode': os.chmod(path, 0o644)
 elif change == 'owner': policy['ownership']['staging_uid'] += 1; auth = policy_module.authorize_manifest(policy, json.loads(auth.manifest_bytes))
 else: open(path, 'wb').write(b'wrong-data')
 rejects(lambda: handoff._publish_at(auth, root))
root, staging, policy, auth = fixture(); original, changed = handoff._verify_bundle, [False]
def replace(*args, **kwargs):
 value = original(*args, **kwargs)
 if not changed[0]:
  path = transaction(staging, auth) + '/node_rollback'; os.unlink(path); open(path, 'wb').write(b'node-rollback'); os.chmod(path, 0o600); changed[0] = True
 return value
handoff._verify_bundle = replace; rejects(lambda: handoff._publish_at(auth, root)); handoff._verify_bundle = original
`));
  it('fsyncs and verifies the full set before ordered bundle and final directory handoff', () => check(`
root, staging, policy, auth = fixture(); events, fsync, chown, chmod, verify = [], handoff.os.fsync, handoff.os.fchown, handoff.os.fchmod, handoff._verify_bundle
handoff.os.fsync = lambda fd: (events.append(('sync', fd)), fsync(fd))[1]
handoff.os.fchown = lambda fd, uid, gid: (events.append(('chown', uid, gid)), chown(fd, uid, gid))[1]
handoff.os.fchmod = lambda fd, mode: (events.append(('chmod', mode)), chmod(fd, mode))[1]
handoff._verify_bundle = lambda *a, **k: (events.append(('verify', a[1])), verify(*a, **k))[1]
records = handoff._publish_at(auth, root); handoff.os.fsync, handoff.os.fchown, handoff.os.fchmod, handoff._verify_bundle = fsync, chown, chmod, verify
assert len(records) == 4 and all(not any(value == root or type(value) is str and value.startswith(root) for value in row) for row in records)
first = next(i for i, event in enumerate(events) if event[0] == 'chown'); assert sum(event[0] == 'sync' for event in events[:first]) >= 5 and sum(event[0] == 'verify' for event in events[:first]) == 4
assert [event[0] for event in events].count('chown') == 5 and events[-1][0] == 'sync'
assert stat.S_IMODE(os.stat(transaction(staging, auth)).st_mode) == 0o700
try: records[0].logical_name = 'x'; raise AssertionError()
except AttributeError: pass
`));
  it('uses exact distinct release identity calls without exposing identities in results', () => check(`
root, staging, policy, auth = fixture((123, 456)); events, chown, fstat = [], handoff.os.fchown, handoff.os.fstat
changed = set()
def fake_chown(fd, uid, gid):
 value = fstat(fd); events.append((fd, uid, gid)); changed.add((value.st_dev, value.st_ino))
def fake_fstat(fd):
 value = fstat(fd)
 if (value.st_dev, value.st_ino) in changed: return os.stat_result((value.st_mode, value.st_ino, value.st_dev, value.st_nlink, 123, 456, value.st_size, value.st_atime, value.st_mtime, value.st_ctime))
 return value
stable = handoff.staging._stable; handoff.os.fchown, handoff.os.fstat, handoff.staging._stable = fake_chown, fake_fstat, lambda links: None
records = handoff._publish_at(auth, root); handoff.os.fchown, handoff.os.fstat, handoff.staging._stable = chown, fstat, stable
assert [pair[1:] for pair in events] == [(123, 456)] * 5 and '123' not in repr(records) and '456' not in repr(records)
`));
  it('restores only unchanged bundles before handoff and preserves replacements', () => check(`
root, staging, policy, auth = fixture(); original, changed = handoff._release_bundle, [False]
def fail(parent, name, *args):
 original(parent, name, *args)
 if not changed[0]:
  path = transaction(staging, auth) + '/' + name; os.unlink(path); open(path, 'wb').write(b'replacement'); os.chmod(path, 0o600); changed[0] = True; raise OSError()
handoff._release_bundle = fail; rejects(lambda: handoff._publish_at(auth, root)); handoff._release_bundle = original
assert open(transaction(staging, auth) + '/node_rollback', 'rb').read() == b'replacement'
`));
  it('preserves the transaction after handoff begins and closes descriptors on faults', () => check(`
root, staging, policy, auth = fixture(); chown, chowns = handoff.os.fchown, []
def fail_transaction_chown(fd, uid, gid):
 chowns.append((uid, gid))
 if len(chowns) == 5: raise OSError()
 return chown(fd, uid, gid)
handoff.os.fchown = fail_transaction_chown; rejects(lambda: handoff._publish_at(auth, root)); handoff.os.fchown = chown
assert len(chowns) == 9
root, staging, policy, auth = fixture(); baseline, chmod, seen = len(os.listdir('/proc/self/fd')), handoff.os.fchmod, [0]
def fail_after_directory_chown(fd, mode):
 seen[0] += 1
 if seen[0] == 5: raise OSError()
 return chmod(fd, mode)
handoff.os.fchmod = fail_after_directory_chown; rejects(lambda: handoff._publish_at(auth, root)); handoff.os.fchmod = chmod
assert os.path.isdir(transaction(staging, auth)) and len(os.listdir('/proc/self/fd')) == baseline
for operation in ('close', 'fstat', 'fsync', 'fchmod'):
 root, staging, policy, auth = fixture(); saved, failed = getattr(handoff.os, operation), [False]
 def once(*args, saved=saved):
  if not failed[0]: failed[0] = True; raise OSError()
  return saved(*args)
 setattr(handoff.os, operation, once); rejects(lambda: handoff._publish_at(auth, root)); setattr(handoff.os, operation, saved)
assert not any(word in open(handoff.__file__).read() for word in ('subprocess', 'getenv', 'system(', 'copyfile', 'shutil'))
`));
});

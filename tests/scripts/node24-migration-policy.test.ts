import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
const moduleName = 'ops.scripts.node24_migration_policy';
const sha = (value: string, size: number) => value.repeat(size);
const policy = {
  schema: 'botanica-ob.node24-migration-policy.v1', candidate_sha: sha('a', 40), rollback_sha: sha('b', 40),
  paths: {
    checkpoint: '/var/lib/botanica-ob/checkpoint.json', lock: '/var/lib/botanica-ob/checkpoint.json.lock',
    artifacts: '/var/lib/botanica-ob/artifacts', staging: '/var/lib/botanica-ob/runtime-staging',
    app: '/srv/botanica-ob', releases: '/srv/botanica-ob/releases', current: '/srv/botanica-ob/current',
    preparer: '/var/lib/botanica-ob/runtime-staging/preparer',
  },
  ownership: { artifact_uid: 1001, artifact_gid: 1001, staging_uid: 1002, staging_gid: 1002, release_uid: 1003, release_gid: 1003 },
  modes: { managed_root: 0o755, artifact: 0o600, private_workspace: 0o700, staged_bundle: 0o600, initial_release: 0o755, sealed_release: 0o555 },
  limits: { max_bundle_size: 40, max_total_size: 100 },
  units: { canonical: 'botanica-ob.service', authorized: ['botanica-ob.service', 'botanica-worker.service'] },
  artifacts: {
    source_release: { identity: '/var/lib/botanica-ob/artifacts/source.tar.gz', digest: sha('1', 64), size: 10, version: sha('a', 40), architecture: 'all', closure: [{ identity: 'source', version: sha('a', 40), architecture: 'all', size: 10, digest: sha('5', 64) }] },
    node_target: { identity: '/var/lib/botanica-ob/artifacts/node24.deb', digest: sha('2', 64), size: 20, version: '24.19.0', architecture: 'amd64', closure: [{ identity: 'nodejs', version: '24.19.0', architecture: 'amd64', size: 20, digest: sha('6', 64) }] },
    node_rollback: { identity: '/var/lib/botanica-ob/artifacts/node20.deb', digest: sha('3', 64), size: 20, version: '20.20.2', architecture: 'amd64', closure: [{ identity: 'nodejs', version: '20.20.2', architecture: 'amd64', size: 20, digest: sha('7', 64) }] },
    pm2: { identity: '/var/lib/botanica-ob/artifacts/pm2.tgz', digest: sha('4', 64), size: 30, version: '7.0.3', architecture: 'all', closure: [{ identity: 'pm2', version: '7.0.3', architecture: 'all', size: 30, digest: sha('8', 64) }] },
  },
};
const manifest = {
  transaction_id: 'node24-migration-20260420-000001', sequence: 1, stage: 'manifest_validated',
  candidate_sha: policy.candidate_sha, rollback_sha: policy.rollback_sha,
  artifacts: Object.fromEntries(Object.entries(policy.artifacts).map(([key, value]) => [key, { identity: value.identity, digest: value.digest, ...key.startsWith('node_') || key === 'pm2' ? { version: value.version, architecture: value.architecture } : {} }])),
  paths: { checkpoint: policy.paths.checkpoint, lock: policy.paths.lock, runtime_staging: policy.paths.staging, candidate_release: `${policy.paths.releases}/${policy.candidate_sha}`, rollback_release: `${policy.paths.releases}/${policy.rollback_sha}`, current_link: policy.paths.current },
  units: policy.units,
};
function run(source: string) {
  return spawnSync('/usr/bin/python3', ['-c', [
    'import copy, hashlib, inspect, json, os, stat, tempfile, time', 'from types import SimpleNamespace',
    'from importlib import import_module', `policy_module = import_module(${JSON.stringify(moduleName)})`,
    "def rejects(action):\n  try: action()\n  except policy_module.PolicyError as error:\n    assert type(error) is policy_module.PolicyError and str(error) == 'invalid migration policy'; return\n  raise AssertionError('expected generic rejection')",
    `policy = json.loads(${JSON.stringify(JSON.stringify(policy))})`, `manifest = json.loads(${JSON.stringify(JSON.stringify(manifest))})`,
    'def canonical(value): return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True) + "\\n").encode("ascii")', source,
  ].join('\n')], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
}
function check(source: string) { const result = run(source); expect(result.status, result.stderr).toBe(0); }
describe('Node 24 migration policy authority', () => {
  it('accepts only the exact recursively safe policy schema and bounds', () => check(`
clean = policy_module._validate_policy(policy); assert clean == policy and clean is not policy
invalid = []
def changed(path, value):
  candidate = copy.deepcopy(policy); target = candidate
  for key in path[:-1]: target = target[key]
  target[path[-1]] = value; invalid.append(candidate)
unknown = copy.deepcopy(policy); unknown['extra'] = 1; invalid.append(unknown)
missing = copy.deepcopy(policy); del missing['limits']; invalid.append(missing)
sensitive = copy.deepcopy(policy); sensitive['artifacts']['pm2']['token'] = 'x'; invalid.append(sensitive)
for path, value in [(('schema',), 'v1'), (('candidate_sha',), 'A' * 40), (('paths','lock'), '/tmp/lock'),
 (('paths','preparer'), '/var/lib/../escape'), (('ownership','artifact_uid'), -1), (('ownership','release_gid'), 2**32-1),
 (('modes','sealed_release'), 0o755), (('limits','max_bundle_size'), 19), (('limits','max_total_size'), 79),
 (('units','authorized'), ['botanica-worker.service','botanica-ob.service']), (('artifacts','node_target','version'), '23.1.0'),
 (('artifacts','node_rollback','architecture'), 'arm64'), (('artifacts','pm2','version'), '7.0.4'),
 (('artifacts','source_release','size'), 9), (('artifacts','pm2','digest'), 'x' * 64),
 (('artifacts','pm2','closure',0,'identity'), '../pm2'), (('artifacts','pm2','closure',0,'size'), 29),
 (('artifacts','node_target','closure',0,'version'), 'x'), (('artifacts','node_target','closure',0,'architecture'), 'arm64'),
 (('artifacts','source_release','closure',0,'identity'), 'release'), (('artifacts','pm2','closure',0,'identity'), 'npm'),
 (('paths','staging'), '/var/lib/botanica-ob/artifacts')]: changed(path, value)
for app in ('/var/lib/botanica-ob', '/var/lib/botanica-ob/app', '/var/lib', '//srv/botanica-ob'):
  candidate = copy.deepcopy(policy); candidate['paths'].update(app=app, releases=f'{app}/releases', current=f'{app}/current'); invalid.append(candidate)
alias = copy.deepcopy(policy); alias['paths'].update(staging=alias['paths']['checkpoint'], preparer=alias['paths']['checkpoint'] + '/preparer')
invalid.append(alias)
duplicate = copy.deepcopy(policy); duplicate['artifacts']['pm2']['closure'].append(copy.deepcopy(duplicate['artifacts']['pm2']['closure'][0])); invalid.append(duplicate)
for candidate in invalid: rejects(lambda candidate=candidate: policy_module._validate_policy(candidate))
`));

  it('loads canonical policy through stable owner-only descriptors without leaks', () => check(`
def write(root, raw=None):
  os.mkdir(os.path.join(root, 'etc'), 0o700); path = os.path.join(root, 'etc', 'policy.json')
  open(path, 'wb').write(canonical(policy) if raw is None else raw); os.chmod(path, 0o600); return path
def load(root): return policy_module._load_policy_at(root, 'etc/policy.json', os.getuid(), os.getgid())
with tempfile.TemporaryDirectory() as root:
  path = write(root); original = policy_module.os.read
  policy_module.os.read = lambda fd, count: original(fd, min(count, 7))
  try: assert load(root) == policy
  finally: policy_module.os.read = original
  os.chmod(path, 0o640); rejects(lambda: load(root)); os.chmod(path, 0o600)
  link = path + '.link'; os.link(path, link); rejects(lambda: load(root)); os.unlink(link)
  real = path + '.real'; os.rename(path, real); os.symlink(real, path); rejects(lambda: load(root)); os.unlink(path); os.rename(real, path)
  before = len(os.listdir('/proc/self/fd'))
  for _ in range(40): assert load(root) == policy
  malformed = copy.deepcopy(policy); malformed['artifacts']['pm2']['digest'] = 'x' * 64; open(path, 'wb').write(canonical(malformed))
  for _ in range(40): rejects(lambda: load(root))
  for _ in range(40): rejects(lambda: policy_module._load_policy_at(root, 'etc/missing.json', os.getuid(), os.getgid()))
  assert len(os.listdir('/proc/self/fd')) == before
with tempfile.TemporaryDirectory() as root:
  write(root, b'\\xff')
  try: load(root)
  except policy_module.PolicyError as error: assert error.__cause__ is None and error.__suppress_context__ is True
  else: raise AssertionError('expected decoder rejection')
for raw in [b'\\xff', b'{', b'x' * (policy_module._MAX_BYTES + 1), canonical(policy).replace(b'"schema":', b'"schema":"duplicate","schema":')]:
  with tempfile.TemporaryDirectory() as root: write(root, raw); rejects(lambda: load(root))
with tempfile.TemporaryDirectory() as root:
  path = write(root); rejects(lambda: policy_module._load_policy_at(root, 'etc/policy.json', os.getuid() + 1, os.getgid()))
  rejects(lambda: policy_module._load_policy_at(root, 'etc/policy.json', os.getuid(), os.getgid() + 1))
  os.chmod(os.path.join(root, 'etc'), 0o777); rejects(lambda: load(root)); os.chmod(os.path.join(root, 'etc'), 0o700)
for replaced in ('leaf', 'ancestor'):
  with tempfile.TemporaryDirectory() as root:
    path = write(root); original = policy_module.os.read
    def replace(fd, count):
      data = original(fd, count)
      target = path if replaced == 'leaf' else os.path.dirname(path)
      if os.path.exists(target) and not os.path.exists(target + '.old'): os.rename(target, target + '.old'); os.mkdir(target, 0o700) if replaced == 'ancestor' else open(target, 'wb').write(canonical(policy))
      if replaced == 'leaf' and os.path.exists(target): os.chmod(target, 0o600)
      return data
    policy_module.os.read = replace
    try: rejects(lambda: load(root))
    finally: policy_module.os.read = original
with tempfile.TemporaryDirectory() as root:
  os.symlink('/tmp', os.path.join(root, 'etc')); rejects(lambda: load(root))
with tempfile.TemporaryDirectory() as root:
  os.mkdir(os.path.join(root, 'etc'), 0o700); os.mkdir(os.path.join(root, 'etc', 'policy.json')); rejects(lambda: load(root))
with tempfile.TemporaryDirectory() as root:
  os.mkdir(os.path.join(root, 'etc'), 0o700); os.mkfifo(os.path.join(root, 'etc', 'policy.json'), 0o600)
  started = time.monotonic(); rejects(lambda: load(root)); assert time.monotonic() - started < 1
for ancestor, field in ((1, 'st_gid'), (2, 'st_uid')):
  with tempfile.TemporaryDirectory() as root:
    path = write(root); metadata = [os.stat(root), os.stat(os.path.join(root, 'etc')), os.stat(path)]
    assert metadata[0].st_uid == os.getuid() and metadata[0].st_gid == os.getgid()
    info = metadata[ancestor]
    metadata[ancestor] = SimpleNamespace(st_mode=info.st_mode, st_uid=info.st_uid + (field == 'st_uid'), st_gid=info.st_gid + (field == 'st_gid'))
    original, sequence = policy_module.os.fstat, iter(metadata[:ancestor + 1]); policy_module.os.fstat = lambda fd: next(sequence)
    try: rejects(lambda: load(root))
    finally: policy_module.os.fstat = original
`));

  it('binds only a validated sequence-one checkpoint with no overlapping drift', () => check(`
result = policy_module.authorize_manifest(policy, manifest); assert result.transaction_id == manifest['transaction_id']
for path, value in [(('sequence',), 2), (('stage',), 'prepared'), (('candidate_sha',), 'c' * 40),
 (('paths','runtime_staging'), '/tmp/staging'), (('units','authorized'), ['botanica-ob.service']),
 (('artifacts','node_target','version'), '24.20.0'), (('artifacts','pm2','digest'), '9' * 64)]:
  candidate = copy.deepcopy(manifest); target = candidate
  for key in path[:-1]: target = target[key]
  target[path[-1]] = value; rejects(lambda candidate=candidate: policy_module.authorize_manifest(policy, candidate))
`));

  it('returns deterministic immutable sanitized authorization bytes', () => check(`
first = policy_module.authorize_manifest(policy, manifest); second = policy_module.authorize_manifest(copy.deepcopy(policy), copy.deepcopy(manifest))
assert first == second and type(first) is policy_module.Authorization and first.policy_bytes == canonical(policy)
assert first.manifest_bytes == canonical(manifest) and first.policy_digest == hashlib.sha256(first.policy_bytes).hexdigest()
policy['artifacts']['pm2']['closure'][0]['digest'] = '0' * 64; manifest['units']['authorized'].append('evil.service')
assert first == second and isinstance(first.policy_bytes, bytes) and isinstance(first.manifest_bytes, bytes)
try: first.transaction_id = 'changed'; raise AssertionError('mutable')
except AttributeError: pass
assert not any(hasattr(policy_module, name) for name in ('stage_artifacts', 'copy_artifacts', 'main'))
assert not inspect.signature(policy_module.load_policy).parameters and policy_module._POLICY_RELATIVE == 'etc/botanica-ob/node24-migration-policy.json'
source = inspect.getsource(policy_module); assert 'subprocess' not in source and 'getenv' not in source
`));
});

import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const moduleName = 'ops.scripts.node24_migration_checkpoint';
const manifest = JSON.stringify({
  transaction_id: 'node24-migration-20260420-000001', sequence: 1, stage: 'manifest_validated',
  candidate_sha: 'a'.repeat(40), rollback_sha: 'b'.repeat(40),
  artifacts: {
    source_release: { identity: '/var/lib/botanica-ob/artifacts/source.tar.gz', digest: '1'.repeat(64) },
    node_target: { identity: '/var/lib/botanica-ob/artifacts/node24.deb', version: '24.19.0', architecture: 'amd64', digest: '2'.repeat(64) },
    node_rollback: { identity: '/var/lib/botanica-ob/artifacts/node20.deb', version: '20.20.2', architecture: 'amd64', digest: '3'.repeat(64) },
    pm2: { identity: '/var/lib/botanica-ob/artifacts/pm2.tgz', version: '7.0.3', architecture: 'all', digest: '4'.repeat(64) },
  },
  paths: {
    checkpoint: '/var/lib/botanica-ob/checkpoint.json', lock: '/var/lib/botanica-ob/checkpoint.json.lock',
    runtime_staging: '/var/lib/botanica-ob/runtime-staging', candidate_release: `/srv/botanica-ob/releases/${'a'.repeat(40)}`,
    rollback_release: `/srv/botanica-ob/releases/${'b'.repeat(40)}`, current_link: '/srv/botanica-ob/current',
  }, units: { canonical: 'botanica-ob.service', authorized: ['botanica-ob.service', 'botanica-worker.service'] },
});
function run(source: string) {
  return spawnSync('/usr/bin/python3', ['-c', [
    'import copy, glob, json, os, stat, tempfile, threading, time',
    'from importlib import import_module', `checkpoint = import_module(${JSON.stringify(moduleName)})`,
    'def rejects(action):', '  try: action()', '  except checkpoint.CheckpointError as error:',
    "    assert type(error) is checkpoint.CheckpointError and str(error) == 'invalid checkpoint'; return",
    "  raise AssertionError('expected generic rejection')", `manifest = json.loads(${JSON.stringify(manifest)})`,
    'def local_manifest(root):', '  value = copy.deepcopy(manifest)',
    '  value["paths"]["checkpoint"] = os.path.join(root, "checkpoint.json")',
    '  value["paths"]["lock"] = value["paths"]["checkpoint"] + ".lock"', '  return value', source,
  ].join('\n')], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
}
function check(source: string) {
  const result = run(source);
  expect(result.status, result.stderr).toBe(0);
}
describe('Node 24 migration checkpoint foundation', () => {
  it('recursively validates only the exact manifest identity', () => check(`
invalid = []
def changed(path, value):
  candidate = copy.deepcopy(manifest); target = candidate
  for key in path[:-1]: target = target[key]
  target[path[-1]] = value; invalid.append(candidate)
unknown = copy.deepcopy(manifest); unknown['unknown'] = 'value'; invalid.append(unknown)
missing = copy.deepcopy(manifest); del missing['candidate_sha']; invalid.append(missing)
changed(('artifacts', 'source_release', 'secret'), 'never-accepted')
changed(('artifacts', 'node_target', 'provenance'), 'never-accepted')
for path, value in [(('candidate_sha',), 'A' * 40), (('rollback_sha',), 'short'),
  (('artifacts', 'pm2', 'digest'), 'd' * 63), (('artifacts', 'node_target', 'version'), '24.19'),
  (('artifacts', 'node_target', 'architecture'), 'arm64'), (('transaction_id',), 'unsafe\\nvalue'),
  (('artifacts', 'pm2', 'identity'), '../pm2.tgz'), (('paths', 'checkpoint'), '/var/lib/botanica-ob/../escape'),
  (('sequence',), 0), (('stage',), 'prepared')]: changed(path, value)
duplicate = copy.deepcopy(manifest); duplicate['units']['authorized'].append('botanica-ob.service'); invalid.append(duplicate)
absent = copy.deepcopy(manifest); absent['units']['authorized'].remove('botanica-ob.service'); invalid.append(absent)
for candidate in invalid: rejects(lambda candidate=candidate: checkpoint.validate_manifest(candidate))
`));
  it('publishes once, cleans its temp, and notifies only after durable cleanup', () => check(`
with tempfile.TemporaryDirectory() as root:
  value, trace = local_manifest(root), []
  def record(event):
    assert not glob.glob(os.path.join(root, '.checkpoint-*.tmp')); trace.append(event)
    if event == 'temporary_write': raise RuntimeError('observer failure')
  path = value['paths']['checkpoint']; checkpoint.publish_initial_checkpoint(path, value, trace=record)
  assert stat.S_IMODE(os.lstat(path).st_mode) == stat.S_IMODE(os.lstat(path + '.lock').st_mode) == 0o600
  assert trace == ['temporary_write', 'file_fsync', 'atomic_publish', 'parent_directory_fsync']
  assert json.load(open(path)) == value
  rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=record))
with tempfile.TemporaryDirectory() as root:
  value, path = local_manifest(root), os.path.join(root, 'checkpoint.json')
  original = checkpoint.os.fsync
  checkpoint.os.fsync = lambda _: (_ for _ in ()).throw(OSError('failure'))
  try: rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
  finally: checkpoint.os.fsync = original
  assert not glob.glob(os.path.join(root, '.checkpoint-*.tmp'))
with tempfile.TemporaryDirectory() as root:
  value, path, calls, trace = local_manifest(root), os.path.join(root, 'checkpoint.json'), [0], []
  original = checkpoint.os.fstat
  def fail_initial_temp_fstat(fd):
    calls[0] += 1
    if calls[0] == 2: raise OSError('failure')
    return original(fd)
  checkpoint.os.fstat = fail_initial_temp_fstat
  try: rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=trace.append))
  finally: checkpoint.os.fstat = original
  assert calls[0] >= 3 and not glob.glob(os.path.join(root, '.checkpoint-*.tmp')) and trace == []
with tempfile.TemporaryDirectory() as root:
  value, path, trace = local_manifest(root), os.path.join(root, 'checkpoint.json'), []
  original = checkpoint.os.unlink
  def fail_temp_unlink(candidate):
    if os.path.basename(candidate).startswith('.checkpoint-'): raise OSError('failure')
    return original(candidate)
  checkpoint.os.unlink = fail_temp_unlink
  try: checkpoint.publish_initial_checkpoint(path, value, trace=trace.append)
  finally: checkpoint.os.unlink = original
  assert checkpoint.load_checkpoint(path, max_bytes=4096) == value
  assert glob.glob(os.path.join(root, '.checkpoint-*.tmp')) and trace == []
`));
  it('rejects unsafe owners, destinations, lock replacement, and regression', () => check(`
with tempfile.TemporaryDirectory() as root:
  value, path = local_manifest(root), os.path.join(root, 'checkpoint.json')
  open(path, 'w').write('{}'); rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
  os.unlink(path); os.symlink('/tmp/target', path); rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
  os.unlink(path); os.symlink('/tmp/target', path + '.lock'); rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
with tempfile.TemporaryDirectory() as root:
  value, path = local_manifest(root), os.path.join(root, 'checkpoint.json')
  original = checkpoint.os.geteuid; checkpoint.os.geteuid = lambda: original() + 1
  try: rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
  finally: checkpoint.os.geteuid = original
  os.chmod(root, 0o777); rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
with tempfile.TemporaryDirectory() as root:
  value, path = local_manifest(root), os.path.join(root, 'checkpoint.json')
  original = checkpoint.fcntl.flock
  def replace_lock(fd, operation):
    original(fd, operation)
    if operation == checkpoint.fcntl.LOCK_EX:
      os.unlink(path + '.lock'); open(path + '.lock', 'w').close(); os.chmod(path + '.lock', 0o644)
  checkpoint.fcntl.flock = replace_lock
  try: rejects(lambda: checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None))
  finally: checkpoint.fcntl.flock = original
  assert not os.path.exists(path)
`));
  it('loads bounded, duplicate-free data through EOF without modifying the file', () => check(`
with tempfile.TemporaryDirectory() as root:
  value, path = local_manifest(root), os.path.join(root, 'checkpoint.json')
  checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None); before = os.stat(path)
  original = checkpoint.os.read; checkpoint.os.read = lambda fd, count: original(fd, min(count, 7))
  try: loaded = checkpoint.load_checkpoint(path, max_bytes=4096)
  finally: checkpoint.os.read = original
  loaded['units']['authorized'].append('extra.service')
  assert checkpoint.load_checkpoint(path, max_bytes=4096) == value
  assert checkpoint.checkpoint_status(path, max_bytes=4096) == {'transaction_id': value['transaction_id'], 'sequence': 1, 'stage': 'manifest_validated'}
  after = os.stat(path); assert (before.st_ino, before.st_mtime_ns, before.st_mode) == (after.st_ino, after.st_mtime_ns, after.st_mode)
  copied = path + '.copy'; open(copied, 'wb').write(open(path, 'rb').read()); os.chmod(copied, 0o600)
  rejects(lambda: checkpoint.load_checkpoint(copied, max_bytes=4096))
  os.chmod(path, 0o644); rejects(lambda: checkpoint.load_checkpoint(path, max_bytes=4096))
  os.chmod(path, 0o600); open(path, 'w').write('{'); rejects(lambda: checkpoint.load_checkpoint(path, max_bytes=4096))
  open(path, 'w').write('x' * 4097); rejects(lambda: checkpoint.load_checkpoint(path, max_bytes=4096))
  raw = json.dumps(value).replace('"sequence": 1', '"sequence": 1, "sequence": 1')
  open(path, 'w').write(raw); rejects(lambda: checkpoint.load_checkpoint(path, max_bytes=4096))
  unsafe = copy.deepcopy(value); unsafe['artifacts']['source_release']['secret'] = 'do-not-disclose'
  open(path, 'w').write(json.dumps(unsafe)); rejects(lambda: checkpoint.load_checkpoint(path, max_bytes=4096))
`));
  it('uses the sibling lock before either concurrent writer reaches temporary creation', () => check(`
with tempfile.TemporaryDirectory() as root:
  value, path, entered, release, calls, results = local_manifest(root), os.path.join(root, 'checkpoint.json'), threading.Event(), threading.Event(), [], []
  original = checkpoint._write_temp
  def paused(parent, data, uid):
    calls.append(threading.get_ident()); entered.set(); release.wait(1); return original(parent, data, uid)
  checkpoint._write_temp = paused
  def writer():
    try:
      checkpoint.publish_initial_checkpoint(path, value, trace=lambda _: None); results.append('published')
    except Exception: results.append('rejected')
  first = threading.Thread(target=writer); second = threading.Thread(target=writer)
  first.start(); assert entered.wait(1); second.start(); time.sleep(.05); assert len(calls) == 1
  release.set(); first.join(); second.join(); checkpoint._write_temp = original
  assert sorted(results) == ['published', 'rejected'] and os.path.exists(path)
`));
});

"""Descriptor-safe staging of the authorization's immutable artifact set."""
import hashlib
import json
import os
import stat
from collections import namedtuple
from functools import wraps

from ops.scripts import node24_migration_checkpoint as checkpoint
from ops.scripts import node24_migration_policy as policy
RootStagedArtifact = namedtuple("RootStagedArtifact", ("transaction_id", "policy_digest", "logical_name", "digest", "size", "relative_identity"))
_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC
_DIR_FLAGS = _FLAGS | os.O_DIRECTORY
class StagingError(ValueError):
    """A bounded failure that does not disclose filesystem inventory."""
def _reject():
    raise StagingError("invalid migration staging")
def _bounded(function):
    @wraps(function)
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception as error:
            if isinstance(error, StagingError):
                raise
            raise StagingError("invalid migration staging") from None
    return call
def _directory(info, uid, gid, mode=None):
    owners = ((uid, gid),) if mode is not None else ((0, 0), (uid, gid))
    if not stat.S_ISDIR(info.st_mode) or stat.S_IMODE(info.st_mode) & 0o022 or (info.st_uid, info.st_gid) not in owners or mode is not None and stat.S_IMODE(info.st_mode) != mode:
        _reject()
def _regular(info, uid, gid, size=None, mode=0o600):
    if not stat.S_ISREG(info.st_mode) or (info.st_uid, info.st_gid) != (uid, gid) or stat.S_IMODE(info.st_mode) != mode or info.st_nlink != 1 or size is not None and info.st_size != size:
        _reject()
def _stable(links):
    for parent, name, child in links:
        if policy._metadata(os.fstat(child)) != policy._metadata(os.stat(name, dir_fd=parent, follow_symlinks=False)):
            _reject()
class _FDs:
    """One owner for descriptors opened during a descriptor walk."""
    def __init__(self):
        self.items = []
    def open(self, *args, **kwargs):
        descriptor = os.open(*args, **kwargs)
        self.items.append(descriptor)
        return descriptor
    def close(self, reject=True):
        failed = []
        for descriptor in reversed(self.items):
            try:
                os.close(descriptor)
            except Exception:
                failed.append(descriptor)
        self.items = failed
        if failed and reject:
            _reject()
        return not failed
def _walk(root, path, uid, gid, leaf=False, nodes=None):
    nodes, links = _FDs() if nodes is None else nodes, []
    try:
        current = nodes.open(root, _DIR_FLAGS)
        _directory(os.fstat(current), uid, gid)
        parts = policy._path(path)[1:].split("/")
        for index, name in enumerate(parts):
            last = index == len(parts) - 1
            child = nodes.open(name, _FLAGS if leaf and last else _DIR_FLAGS, dir_fd=current)
            (_regular if leaf and last else _directory)(os.fstat(child), uid, gid)
            links.append((current, name, child))
            current = child
        _stable(links)
        return current, nodes, links
    except Exception:
        nodes.close(False)
        raise
def _authorization(value):
    if type(value) is not policy.Authorization or type(value.policy_bytes) is not bytes or type(value.manifest_bytes) is not bytes: _reject()
    clean_policy = policy._validate_policy(json.loads(value.policy_bytes.decode("utf-8"), object_pairs_hook=policy._unique_object))
    clean_manifest = checkpoint.validate_manifest(json.loads(value.manifest_bytes.decode("utf-8"), object_pairs_hook=checkpoint._unique_object))
    if (value.policy_bytes != policy._encode(clean_policy)
            or value.manifest_bytes != policy._encode(clean_manifest)):
        _reject()
    expected = policy.authorize_manifest(clean_policy, clean_manifest)
    if value != expected or clean_manifest["sequence"] != 1 or clean_manifest["stage"] != "manifest_validated":
        _reject()
    return clean_policy, clean_manifest
def _digest(source, size, digest, target=None):
    hashed, total = hashlib.sha256(), 0
    while total < size:
        chunk = os.read(source, min(65536, size - total))
        if not chunk:
            _reject()
        hashed.update(chunk)
        total += len(chunk)
        view = memoryview(chunk)
        while target is not None and view:
            written = os.write(target, view)
            if type(written) is not int or written <= 0:
                _reject()
            view = view[written:]
    if os.read(source, 1) or total != size or hashed.hexdigest() != digest:
        _reject()
def _verify_bundle(parent, name, item, uid, gid, mode, failed_nodes):
    nodes = _FDs()
    descriptor = nodes.open(name, _FLAGS, dir_fd=parent)
    try:
        _regular(os.fstat(descriptor), uid, gid, item["size"], mode)
        _digest(descriptor, item["size"], item["digest"])
        _stable(((parent, name, descriptor),))
    finally:
        if not nodes.close(False):
            failed_nodes.append(nodes)
            _reject()
def _attempt(action, fallback):
    try:
        return action()
    except Exception:
        return fallback
def _same_named(parent, name, expected):
    return _attempt(lambda: policy._metadata(os.stat(name, dir_fd=parent, follow_symlinks=False)) == expected, False)
def _cleanup(stage_fd, transaction, transaction_fd, transaction_nodes, transaction_meta, created):
    clean = False
    try:
        if None not in (stage_fd, transaction, transaction_meta) and _same_named(stage_fd, transaction, transaction_meta):
            if transaction_fd is None or policy._metadata(os.fstat(transaction_fd)) == transaction_meta:
                for name, expected in created.items():
                    if transaction_fd is not None and _same_named(transaction_fd, name, expected):
                        os.unlink(name, dir_fd=transaction_fd)
                        os.fsync(transaction_fd)
                transaction_meta = policy._metadata(os.fstat(transaction_fd)) if transaction_fd is not None else transaction_meta
                if _same_named(stage_fd, transaction, transaction_meta):
                    os.rmdir(transaction, dir_fd=stage_fd)
                    os.fsync(stage_fd)
                    clean = True
    except Exception:
        pass
    finally:
        if transaction_fd is not None and not transaction_nodes.close(False):
            clean = False
    return clean
def _stage_at(authorization, root):
    clean, manifest = _authorization(authorization)
    if type(root) is not str or not os.path.isabs(root) or os.path.normpath(root) != root:
        _reject()
    own, paths, stage_nodes = clean["ownership"], clean["paths"], None
    transaction_nodes, failed_nodes = _FDs(), []
    stage_fd = transaction_fd = transaction = transaction_meta = None
    stage_links, created = [], {}
    try:
        stage_nodes = _FDs()
        stage_fd, stage_nodes, stage_links = _walk(root, paths["staging"], own["staging_uid"], own["staging_gid"], nodes=stage_nodes)
        _directory(os.fstat(stage_fd), own["staging_uid"], own["staging_gid"], 0o755)
        transaction = manifest["transaction_id"]
        os.mkdir(transaction, clean["modes"]["private_workspace"], dir_fd=stage_fd)
        transaction_meta = policy._metadata(os.stat(transaction, dir_fd=stage_fd, follow_symlinks=False))
        transaction_fd = transaction_nodes.open(transaction, _DIR_FLAGS, dir_fd=stage_fd)
        _stable(((stage_fd, transaction, transaction_fd),))
        os.fchmod(transaction_fd, clean["modes"]["private_workspace"])
        _directory(os.fstat(transaction_fd), own["staging_uid"], own["staging_gid"], clean["modes"]["private_workspace"])
        transaction_meta = policy._metadata(os.fstat(transaction_fd))
        for name, item in sorted(clean["artifacts"].items()):
            source = target = source_nodes = target_nodes = None
            try:
                source_nodes = _FDs()
                source, source_nodes, source_links = _walk(root, item["identity"], own["artifact_uid"], own["artifact_gid"], True, source_nodes)
                _regular(os.fstat(source), own["artifact_uid"], own["artifact_gid"], item["size"])
                target_nodes = _FDs()
                target = target_nodes.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, clean["modes"]["staged_bundle"], dir_fd=transaction_fd)
                created[name] = policy._metadata(os.fstat(target))
                os.fchmod(target, clean["modes"]["staged_bundle"])
                _regular(os.fstat(target), own["staging_uid"], own["staging_gid"], 0)
                _digest(source, item["size"], item["digest"], target)
                _stable(source_links)
                _regular(os.fstat(source), own["artifact_uid"], own["artifact_gid"], item["size"])
                _regular(os.fstat(target), own["staging_uid"], own["staging_gid"], item["size"])
                os.fsync(target)
                created[name] = policy._metadata(os.fstat(target))
                _stable(((transaction_fd, name, target),))
            finally:
                if target is not None and transaction_fd is not None:
                    created[name] = _attempt(lambda target_fd=target: policy._metadata(os.fstat(target_fd)), created.get(name))
                    transaction_meta = _attempt(lambda owner_fd=transaction_fd: policy._metadata(os.fstat(owner_fd)), transaction_meta)
                failed = [nodes for nodes in (target_nodes, source_nodes) if nodes is not None and not nodes.close(False)]
                failed_nodes += failed
                if failed:
                    _reject()
        for name, item in sorted(clean["artifacts"].items()):
            _verify_bundle(transaction_fd, name, item, own["staging_uid"], own["staging_gid"], clean["modes"]["staged_bundle"], failed_nodes)
            if not _same_named(transaction_fd, name, created[name]):
                _reject()
        _stable(stage_links + [(stage_fd, transaction, transaction_fd)])
        os.fsync(transaction_fd)
        os.fsync(stage_fd)
        result = tuple(RootStagedArtifact(transaction, authorization.policy_digest, name, item["digest"], item["size"], transaction + "/" + name) for name, item in sorted(clean["artifacts"].items()))
        transaction_nodes.close()
        transaction_fd = None
        stage_nodes.close()
        stage_nodes = None
        return result
    except Exception:
        _cleanup(stage_fd, transaction, transaction_fd, transaction_nodes, transaction_meta, created)
        transaction_nodes.close(False)
        for nodes in failed_nodes + ([stage_nodes] if stage_nodes is not None else []):
            nodes.close(False)
        raise
_stage_at = _bounded(_stage_at)
@_bounded
def stage_authorized_artifacts(authorization):
    if os.geteuid() != 0 or os.getegid() != 0:
        _reject()
    clean, _ = _authorization(authorization)
    if clean["ownership"]["staging_uid"] != 0 or clean["ownership"]["staging_gid"] != 0:
        _reject()
    return _stage_at(authorization, "/")

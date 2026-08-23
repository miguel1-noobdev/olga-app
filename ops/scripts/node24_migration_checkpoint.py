"""User-approved stdlib Python checkpoint support that survives a broken Node runtime."""
import errno
import fcntl
import json
import os
import re
import secrets
import stat
from typing import NoReturn
class CheckpointError(ValueError):
    """A bounded error that never includes checkpoint content."""
_MAX_BYTES, _MAX_TEXT, _MAX_UNITS = 8192, 1024, 32
_SHA, _DIGEST = re.compile(r"[0-9a-f]{40}"), re.compile(r"[0-9a-f]{64}")
_UNIT, _VERSION = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.@-]{0,127}\.service"), re.compile(r"\d+\.\d+\.\d+")
_FORBIDDEN = ("secret", "token", "password", "credential", "provenance", "attestation", "signature", "origin")
def _reject() -> NoReturn:
    raise CheckpointError("invalid checkpoint")
def _bounded(function):
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception as error:
            if isinstance(error, CheckpointError):
                raise
            _reject()
    return call
def _text(value, limit=_MAX_TEXT):
    if type(value) is not str or not value or len(value) > limit or any(ord(char) < 32 or ord(char) == 127 for char in value):
        _reject()
    return value
def _path(value):
    value = _text(value)
    if not os.path.isabs(value) or os.path.normpath(value) != value or ".." in value.split("/"):
        _reject()
    return value
def _exact(value, keys):
    if type(value) is not dict or set(value) != set(keys):
        _reject()
    return value
def _safe_keys(value):
    if type(value) is dict:
        for key, child in value.items():
            if type(key) is not str or any(word in key.lower() for word in _FORBIDDEN):
                _reject()
            _safe_keys(child)
    elif type(value) is list:
        for child in value:
            _safe_keys(child)
def _fixed(value, pattern, length):
    value = _text(value, length)
    if not pattern.fullmatch(value):
        _reject()
    return value
def _artifact(value, version=None, architecture=None):
    keys = ("identity", "digest") if version is None else ("identity", "version", "architecture", "digest")
    value = _exact(value, keys)
    result = {"identity": _path(value["identity"]), "digest": _fixed(value["digest"], _DIGEST, 64)}
    if version is not None:
        actual = _text(value["version"], 32)
        valid = actual == version if not version.endswith(".") else _VERSION.fullmatch(actual) and actual.startswith(version)
        if architecture is None or not valid or value["architecture"] != architecture:
            _reject()
        result.update(version=actual, architecture=architecture)
    return result
def _units(value):
    value = _exact(value, ("canonical", "authorized"))
    canonical, authorized = _text(value["canonical"], 128), value["authorized"]
    if not _UNIT.fullmatch(canonical) or type(authorized) is not list:
        _reject()
    authorized = [_text(unit, 128) for unit in authorized]
    if (not authorized or len(authorized) > _MAX_UNITS or len(set(authorized)) != len(authorized)
            or canonical not in authorized or any(not _UNIT.fullmatch(unit) for unit in authorized)):
        _reject()
    return {"canonical": canonical, "authorized": authorized}
def _encode(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True) + "\n").encode("ascii")
def validate_manifest(value) -> dict:
    """Return a canonical defensive copy of the exact checkpoint manifest."""
    _safe_keys(value)
    value = _exact(value, ("transaction_id", "sequence", "stage", "candidate_sha", "rollback_sha", "artifacts", "paths", "units"))
    transaction_id = _text(value["transaction_id"], 128)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,127}", transaction_id):
        _reject()
    if type(value["sequence"]) is not int or value["sequence"] != 1 or value["stage"] != "manifest_validated":
        _reject()
    candidate_sha, rollback_sha = _fixed(value["candidate_sha"], _SHA, 40), _fixed(value["rollback_sha"], _SHA, 40)
    artifacts = _exact(value["artifacts"], ("source_release", "node_target", "node_rollback", "pm2"))
    paths = _exact(value["paths"], ("checkpoint", "lock", "runtime_staging", "candidate_release", "rollback_release", "current_link"))
    result_paths = {key: _path(paths[key]) for key in paths}
    candidate, rollback, current = (result_paths[key] for key in ("candidate_release", "rollback_release", "current_link"))
    if (result_paths["lock"] != result_paths["checkpoint"] + ".lock" or os.path.basename(candidate) != candidate_sha
            or os.path.basename(rollback) != rollback_sha or os.path.dirname(candidate) != os.path.dirname(rollback)
            or os.path.dirname(current) != os.path.dirname(os.path.dirname(candidate))):
        _reject()
    result = {
        "transaction_id": transaction_id, "sequence": 1, "stage": "manifest_validated",
        "candidate_sha": candidate_sha, "rollback_sha": rollback_sha,
        "artifacts": {"source_release": _artifact(artifacts["source_release"]),
                      "node_target": _artifact(artifacts["node_target"], "24.", "amd64"),
                      "node_rollback": _artifact(artifacts["node_rollback"], "20.", "amd64"),
                      "pm2": _artifact(artifacts["pm2"], "7.0.3", "all")},
        "paths": result_paths, "units": _units(value["units"]),
    }
    if len(_encode(result)) > _MAX_BYTES:
        _reject()
    return result
def _lstat(path):
    try:
        return os.lstat(path)
    except OSError as error:
        if error.errno != errno.ENOENT:
            _reject()
        return None
def _same(info, named):
    return named is not None and (named.st_dev, named.st_ino) == (info.st_dev, info.st_ino)
def _regular(info, uid):
    if not stat.S_ISREG(info.st_mode) or info.st_uid != uid or stat.S_IMODE(info.st_mode) != 0o600:
        _reject()
def _parent(path, uid):
    parent, info = os.path.dirname(path), _lstat(os.path.dirname(path))
    if (info is None or stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode)
            or info.st_uid != uid or stat.S_IMODE(info.st_mode) & 0o022):
        _reject()
    return parent
def _unlink_if_same(path, info):
    if not _same(info, _lstat(path)):
        _reject()
    os.unlink(path)
    if _lstat(path) is not None:
        _reject()
def _suppress_noncritical(action):
    try:
        return action() is None
    except Exception:
        return False
def _cleanup_temp_after_failure(path, descriptor, info):
    if info is None and descriptor is not None:
        try:
            info = os.fstat(descriptor)
        except BaseException:
            info = None
    if descriptor is not None:
        _suppress_noncritical(lambda: os.close(descriptor))
    if info is not None:
        _suppress_noncritical(lambda: _unlink_if_same(path, info))
def _open_lock(path, uid):
    descriptor = -1
    try:
        descriptor = os.open(path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        info = os.fstat(descriptor)
        _regular(info, uid)
        if not _same(info, _lstat(path)):
            _reject()
        fcntl.flock(descriptor, fcntl.LOCK_EX)
        named = _lstat(path)
        if not _same(info, named):
            _reject()
        _regular(named, uid)
        return descriptor
    except BaseException:
        if descriptor >= 0:
            _suppress_noncritical(lambda: os.close(descriptor))
        raise
def _write_temp(parent, data, uid):
    for _ in range(32):
        path = os.path.join(parent, ".checkpoint-" + secrets.token_hex(16) + ".tmp")
        try:
            descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        except OSError as error:
            if error.errno == errno.EEXIST:
                continue
            _reject()
        info = None
        try:
            info = os.fstat(descriptor)
            os.fchmod(descriptor, 0o600)
            info = os.fstat(descriptor)
            _regular(info, uid)
            view = memoryview(data)
            while view:
                written = os.write(descriptor, view)
                if written <= 0:
                    _reject()
                view = view[written:]
            return path, descriptor, info
        except BaseException:
            _cleanup_temp_after_failure(path, descriptor, info)
            raise
    _reject()
def publish_initial_checkpoint(path, manifest, *, trace) -> None:
    """Durably publish a manifest once, while holding its sibling lock."""
    clean, uid = validate_manifest(manifest), os.geteuid()
    path = os.fspath(path)
    if type(path) is not str or path != clean["paths"]["checkpoint"]:
        _reject()
    parent, lock_path = _parent(path, uid), clean["paths"]["lock"]
    lock_info = _lstat(lock_path)
    if _lstat(path) is not None or (lock_info is not None and stat.S_ISLNK(lock_info.st_mode)):
        _reject()
    lock, temporary, descriptor, temp_info = _open_lock(lock_path, uid), None, None, None
    events, published = [], False
    try:
        _parent(path, uid)
        if _lstat(path) is not None:
            _reject()
        temporary, descriptor, temp_info = _write_temp(parent, _encode(clean), uid)
        os.fsync(descriptor)
        events.extend(("temporary_write", "file_fsync"))
        os.close(descriptor)
        descriptor = None
        if not _same(temp_info, _lstat(temporary)):
            _reject()
        try:
            os.link(temporary, path, follow_symlinks=False)
        except OSError:
            _reject()
        events.extend(("atomic_publish", "parent_directory_fsync"))
        directory = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fsync(directory)
            if _suppress_noncritical(lambda: _unlink_if_same(temporary, temp_info)):
                temporary = None
                if not _suppress_noncritical(lambda: os.fsync(directory)):
                    events.clear()
            else:
                events.clear()
            published = True
        finally:
            os.close(directory)
    except BaseException:
        if temporary is not None:
            _cleanup_temp_after_failure(temporary, descriptor, temp_info)
        raise
    finally:
        if published:
            fcntl.flock(lock, fcntl.LOCK_UN)
            os.close(lock)
        else:
            _suppress_noncritical(lambda: fcntl.flock(lock, fcntl.LOCK_UN))
            _suppress_noncritical(lambda: os.close(lock))
    for event in events:
        _suppress_noncritical(lambda: trace(event))
def _unique_object(pairs):
    value = dict(pairs)
    if len(value) != len(pairs):
        _reject()
    return value
def load_checkpoint(path, *, max_bytes) -> dict:
    """Load a bounded, owner-only checkpoint and validate it recursively."""
    if type(max_bytes) is not int or not 0 < max_bytes <= _MAX_BYTES:
        _reject()
    path = os.fspath(path)
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(descriptor)
        _regular(info, os.geteuid())
        if not _same(info, _lstat(path)):
            _reject()
        data = bytearray()
        while len(data) <= max_bytes:
            chunk = os.read(descriptor, max_bytes + 1 - len(data))
            if not chunk:
                break
            data.extend(chunk)
        if len(data) > max_bytes:
            _reject()
    finally:
        os.close(descriptor)
    value = validate_manifest(json.loads(data.decode("utf-8"), object_pairs_hook=_unique_object))
    if type(path) is not str or path != value["paths"]["checkpoint"]:
        _reject()
    return value
def checkpoint_status(path, *, max_bytes) -> dict:
    """Return the intentionally small, non-mutating checkpoint status view."""
    value = load_checkpoint(path, max_bytes=max_bytes)
    return {key: value[key] for key in ("transaction_id", "sequence", "stage")}
validate_manifest = _bounded(validate_manifest)
publish_initial_checkpoint = _bounded(publish_initial_checkpoint)
load_checkpoint = _bounded(load_checkpoint)
checkpoint_status = _bounded(checkpoint_status)

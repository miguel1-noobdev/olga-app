import hashlib, json, os, re, stat
from collections import namedtuple
from functools import wraps
from typing import NoReturn
from ops.scripts import node24_migration_checkpoint as checkpoint
class PolicyError(ValueError):
    """A bounded error that never discloses policy content."""
Authorization = namedtuple("Authorization", ("transaction_id", "manifest_bytes", "policy_bytes", "policy_digest"))
_POLICY_RELATIVE, _SCHEMA = "etc/botanica-ob/node24-migration-policy.json", "botanica-ob.node24-migration-policy.v1"
_MAX_BYTES, _MAX_SIZE, _MAX_ID = 65536, 2**63 - 1, 2**32 - 2
_SHA, _DIGEST = re.compile(r"[0-9a-f]{40}"), re.compile(r"[0-9a-f]{64}")
_VERSION, _UNIT, _IDENTITY = re.compile(r"\d+\.\d+\.\d+"), re.compile(r"[A-Za-z0-9][A-Za-z0-9_.@-]{0,127}\.service"), re.compile(r"[A-Za-z0-9][A-Za-z0-9+_.:@-]{0,127}")
_SENSITIVE, _ARTIFACTS = ("secret", "token", "password", "credential", "private_key", "signature"), ("source_release", "node_target", "node_rollback", "pm2")
_MODES = {"managed_root": 0o755, "artifact": 0o600, "private_workspace": 0o700, "staged_bundle": 0o600, "initial_release": 0o755, "sealed_release": 0o555}
def _reject() -> NoReturn:
    raise PolicyError("invalid migration policy")
def _bounded(function):
    @wraps(function)
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception as error:
            if isinstance(error, PolicyError):
                raise error from None
            raise PolicyError("invalid migration policy") from None
    return call
def _exact(value, keys):
    if type(value) is not dict or set(value) != set(keys):
        _reject()
    return value
def _safe_keys(value):
    children = value.items() if type(value) is dict else enumerate(value) if type(value) is list else ()
    for key, child in children:
        if type(value) is dict and (type(key) is not str or not key or not key.isprintable() or any(word in key.lower() for word in _SENSITIVE)):
            _reject()
        _safe_keys(child)
def _text(value, limit=1024):
    if type(value) is not str or not 0 < len(value) <= limit or value.strip() != value or not value.isprintable():
        _reject()
    return value
def _fixed(value, pattern, length):
    value = _text(value, length)
    if not pattern.fullmatch(value):
        _reject()
    return value
def _path(value):
    value = _text(value)
    if value.startswith("//") or not (os.path.isabs(value) and os.path.normpath(value) == value) or ".." in value.split("/"):
        _reject()
    return value
def _number(value, minimum, maximum):
    if type(value) is not int or not minimum <= value <= maximum:
        _reject()
    return value
def _member(value, artifact_version, artifact_architecture, kind):
    value = _exact(value, ("identity", "version", "architecture", "size", "digest"))
    identity = _fixed(value["identity"], _IDENTITY, 128)
    version = _text(value["version"], 64)
    architecture = _text(value["architecture"], 32)
    if kind == "source_release":
        valid_version = version == artifact_version
    elif kind == "pm2" and identity == "pm2":
        valid_version = version == artifact_version
    else:
        valid_version = bool(_VERSION.fullmatch(version))
    if not valid_version or architecture not in (artifact_architecture, "all"):
        _reject()
    return {"identity": identity, "version": version, "architecture": architecture, "size": _number(value["size"], 1, _MAX_SIZE), "digest": _fixed(value["digest"], _DIGEST, 64)}
def _artifact(value, kind, candidate_sha):
    value = _exact(value, ("identity", "digest", "size", "version", "architecture", "closure"))
    version, architecture = _text(value["version"], 64), _text(value["architecture"], 32)
    expected = {"source_release": (candidate_sha, "all"), "node_target": ("24.", "amd64"), "node_rollback": ("20.", "amd64"), "pm2": ("7.0.3", "all")}[kind]
    version_valid = version == expected[0]
    if expected[0].endswith("."):
        version_valid = bool(_VERSION.fullmatch(version) and version.startswith(expected[0]))
    closure = value["closure"]
    if not version_valid or architecture != expected[1] or type(closure) is not list or not closure:
        _reject()
    members = [_member(item, version, architecture, kind) for item in closure]
    identities = [item["identity"] for item in members]
    if identities != sorted(set(identities)):
        _reject()
    primary = {"source_release": "source", "node_target": "nodejs", "node_rollback": "nodejs", "pm2": "pm2"}[kind]
    if not any(item["identity"] == primary and item["version"] == version for item in members):
        _reject()
    size = _number(value["size"], 1, _MAX_SIZE)
    if sum(item["size"] for item in members) != size:
        _reject()
    return {"identity": _path(value["identity"]), "digest": _fixed(value["digest"], _DIGEST, 64), "size": size, "version": version, "architecture": architecture, "closure": members}
def _units(value):
    value = _exact(value, ("canonical", "authorized"))
    canonical, authorized = _text(value["canonical"], 128), value["authorized"]
    if not _UNIT.fullmatch(canonical) or type(authorized) is not list:
        _reject()
    clean = [_fixed(unit, _UNIT, 128) for unit in authorized]
    if not clean or clean != sorted(set(clean)) or canonical not in clean:
        _reject()
    return {"canonical": canonical, "authorized": clean}
def _encode(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True) + "\n").encode("ascii")
def _validate_policy(value):
    _safe_keys(value)
    value = _exact(value, ("schema", "candidate_sha", "rollback_sha", "paths", "ownership", "modes", "limits", "units", "artifacts"))
    if value["schema"] != _SCHEMA:
        _reject()
    candidate = _fixed(value["candidate_sha"], _SHA, 40)
    rollback = _fixed(value["rollback_sha"], _SHA, 40)
    if candidate == rollback:
        _reject()
    paths = _exact(value["paths"], ("checkpoint", "lock", "artifacts", "staging", "app", "releases", "current", "preparer"))
    paths = {key: _path(paths[key]) for key in paths}
    managed = os.path.dirname(paths["checkpoint"])
    if paths["lock"] != paths["checkpoint"] + ".lock":
        _reject()
    if os.path.dirname(paths["artifacts"]) != managed or os.path.dirname(paths["staging"]) != managed:
        _reject()
    if ({paths["checkpoint"], paths["lock"]} & {paths["artifacts"], paths["staging"]}
            or _overlaps(managed, paths["app"]) or _overlaps(paths["artifacts"], paths["staging"])):
        _reject()
    if paths["releases"] != os.path.join(paths["app"], "releases") or paths["current"] != os.path.join(paths["app"], "current"):
        _reject()
    if paths["preparer"] != os.path.join(paths["staging"], "preparer"):
        _reject()
    ownership = _exact(value["ownership"], ("artifact_uid", "artifact_gid", "staging_uid", "staging_gid", "release_uid", "release_gid"))
    ownership = {key: _number(ownership[key], 0, _MAX_ID) for key in ownership}
    modes = _exact(value["modes"], _MODES)
    if modes != _MODES or any(type(mode) is not int for mode in modes.values()):
        _reject()
    limits = _exact(value["limits"], ("max_bundle_size", "max_total_size"))
    max_bundle = _number(limits["max_bundle_size"], 1, _MAX_SIZE)
    max_total = _number(limits["max_total_size"], 1, _MAX_SIZE)
    artifacts = _exact(value["artifacts"], _ARTIFACTS)
    artifacts = {key: _artifact(artifacts[key], key, candidate) for key in _ARTIFACTS}
    identities = [item["identity"] for item in artifacts.values()]
    if len(set(identities)) != len(identities) or any(os.path.dirname(item) != paths["artifacts"] for item in identities):
        _reject()
    sizes = [item["size"] for item in artifacts.values()]
    if any(size > max_bundle for size in sizes) or sum(sizes) > max_total:
        _reject()
    return {"schema": _SCHEMA, "candidate_sha": candidate, "rollback_sha": rollback,
            "paths": paths, "ownership": ownership, "modes": dict(_MODES),
            "limits": {"max_bundle_size": max_bundle, "max_total_size": max_total},
            "units": _units(value["units"]), "artifacts": artifacts}
def _unique_object(pairs):
    value = dict(pairs)
    if len(value) != len(pairs):
        _reject()
    return value
def _overlaps(first, second):
    return os.path.commonpath((first, second)) in (first, second)
def _metadata(info):
    return (info.st_dev, info.st_ino, info.st_mode, info.st_uid, info.st_gid, info.st_nlink, info.st_size, info.st_mtime_ns)
def _directory(info, uid, gid):
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != uid or info.st_gid != gid:
        _reject()
    if stat.S_IMODE(info.st_mode) & 0o022:
        _reject()
def _regular(info, uid, gid):
    if not stat.S_ISREG(info.st_mode) or info.st_uid != uid or info.st_gid != gid:
        _reject()
    if stat.S_IMODE(info.st_mode) != 0o600 or info.st_nlink != 1:
        _reject()
def _load_policy_at(root, relative_path, expected_uid, expected_gid):
    root, relative_path = os.fspath(root), os.fspath(relative_path)
    _number(expected_uid, 0, _MAX_ID)
    _number(expected_gid, 0, _MAX_ID)
    if type(root) is not str or not os.path.isabs(root) or os.path.normpath(root) != root:
        _reject()
    if type(relative_path) is not str or os.path.isabs(relative_path):
        _reject()
    parts = relative_path.split("/")
    if not parts or any(not part or part in (".", "..") or not part.isprintable() for part in parts):
        _reject()
    descriptors, links = [], []
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
    file_flags = os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK
    try:
        descriptor = os.open(root, directory_flags)
        descriptors.append(descriptor)
        root_info = os.fstat(descriptor)
        _directory(root_info, expected_uid, expected_gid)
        for part in parts[:-1]:
            child = os.open(part, directory_flags, dir_fd=descriptor)
            descriptors.append(child)
            info = os.fstat(child)
            _directory(info, expected_uid, expected_gid)
            links.append((descriptor, part, child))
            descriptor = child
        leaf = os.open(parts[-1], file_flags, dir_fd=descriptor)
        descriptors.append(leaf)
        leaf_info = os.fstat(leaf)
        _regular(leaf_info, expected_uid, expected_gid)
        links.append((descriptor, parts[-1], leaf))
        data = bytearray()
        while len(data) <= _MAX_BYTES:
            chunk = os.read(leaf, min(4096, _MAX_BYTES + 1 - len(data)))
            if not chunk:
                break
            data.extend(chunk)
        if len(data) > _MAX_BYTES or _metadata(leaf_info) != _metadata(os.fstat(leaf)):
            _reject()
        if _metadata(root_info) != _metadata(os.stat(root, follow_symlinks=False)):
            _reject()
        for parent, name, child in links:
            named = os.stat(name, dir_fd=parent, follow_symlinks=False)
            if _metadata(os.fstat(child)) != _metadata(named):
                _reject()
        clean = _validate_policy(json.loads(bytes(data).decode("utf-8"), object_pairs_hook=_unique_object))
        if bytes(data) != _encode(clean):
            _reject()
        return clean
    finally:
        closed = True
        for descriptor in reversed(descriptors):
            try: os.close(descriptor)
            except Exception: closed = False
        if not closed: _reject()
def load_policy():
    return _load_policy_at("/", _POLICY_RELATIVE, 0, 0)
def authorize_manifest(policy, manifest):
    clean_policy = _validate_policy(policy)
    clean_manifest = checkpoint.validate_manifest(manifest)
    expected_paths = {
        "checkpoint": clean_policy["paths"]["checkpoint"],
        "lock": clean_policy["paths"]["lock"],
        "runtime_staging": clean_policy["paths"]["staging"],
        "candidate_release": os.path.join(clean_policy["paths"]["releases"], clean_policy["candidate_sha"]),
        "rollback_release": os.path.join(clean_policy["paths"]["releases"], clean_policy["rollback_sha"]),
        "current_link": clean_policy["paths"]["current"],
    }
    expected_artifacts = {}
    for key in _ARTIFACTS:
        artifact = clean_policy["artifacts"][key]
        fields = ("identity", "digest") if key == "source_release" else ("identity", "version", "architecture", "digest")
        expected_artifacts[key] = {field: artifact[field] for field in fields}
    if clean_manifest["candidate_sha"] != clean_policy["candidate_sha"] or clean_manifest["rollback_sha"] != clean_policy["rollback_sha"]:
        _reject()
    if clean_manifest["paths"] != expected_paths or clean_manifest["artifacts"] != expected_artifacts:
        _reject()
    if clean_manifest["units"] != clean_policy["units"]:
        _reject()
    policy_bytes, manifest_bytes = _encode(clean_policy), _encode(clean_manifest)
    return Authorization(clean_manifest["transaction_id"], manifest_bytes, policy_bytes,
                         hashlib.sha256(policy_bytes).hexdigest())
_validate_policy = _bounded(_validate_policy)
_load_policy_at = _bounded(_load_policy_at)
load_policy = _bounded(load_policy)
authorize_manifest = _bounded(authorize_manifest)

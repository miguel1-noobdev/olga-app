"""Pure, bounded validation for an authorized Node 24 preparation transaction."""
import hashlib
import json
from collections import namedtuple
from functools import wraps

from ops.scripts import node24_migration_checkpoint as checkpoint
from ops.scripts import node24_migration_policy as policy

BundleMember = namedtuple("BundleMember", "closure_identity version architecture logical_name size digest")
SourceRelease = namedtuple("SourceRelease", "size digest")
Preparer = namedtuple("Preparer", "identity digest")
PreparationStatus = namedtuple("PreparationStatus", "transaction_id sequence stage")
_PREPARER_IDENTITY = "ops/scripts/node24-prepare-release.sh"
_PREPARER_DIGEST = "f178f17788b61a5cd3b23cfb9746bad49686daf896b63b4027d64553c8e17668"
_MAX_AUTHORIZATION, _MAX_MEMBERS, _MAX_BUNDLE, _MAX_SOURCE = 65536, 64, 512 * 1024**2, 16384

class PreparationContractError(ValueError):
    """A bounded error that never includes authorization or bundle contents."""

def _reject():
    raise PreparationContractError("invalid preparation contract")

def _bounded(function):
    @wraps(function)
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception:
            raise PreparationContractError("invalid preparation contract") from None
    return call

def _decode(raw, validator):
    if type(raw) is not bytes or not raw or len(raw) > _MAX_AUTHORIZATION:
        _reject()
    return validator(json.loads(raw.decode("utf-8"), object_pairs_hook=policy._unique_object))

def _authorization(value):
    if (type(value) is not policy.Authorization
            or any(type(raw) is not bytes or not raw or len(raw) > _MAX_AUTHORIZATION
                   for raw in (value.policy_bytes, value.manifest_bytes))):
        _reject()
    clean_policy = _decode(value.policy_bytes, policy._validate_policy)
    clean_manifest = _decode(value.manifest_bytes, checkpoint.validate_manifest)
    expected = policy.authorize_manifest(clean_policy, clean_manifest)
    if value != expected or value.policy_bytes != policy._encode(clean_policy) or value.manifest_bytes != checkpoint._encode(clean_manifest):
        _reject()
    return clean_policy, clean_manifest

def _entries(clean, logical_name):
    if type(logical_name) is not str or logical_name not in ("node_target", "node_rollback", "pm2"):
        _reject()
    artifact = clean["artifacts"][logical_name]
    closure = artifact["closure"]
    if not 0 < len(closure) <= _MAX_MEMBERS or artifact["size"] > _MAX_BUNDLE or artifact["size"] != sum(member["size"] for member in closure):
        _reject()
    extension = ".tgz" if logical_name == "pm2" else ".deb"
    return artifact, tuple(("%04d%s" % (index, extension), member) for index, member in enumerate(closure))

@_bounded
def validate_bundle(authorization, logical_name, bundle_bytes):
    """Validate exact authorized closure bytes without inspecting embedded metadata."""
    clean, _ = _authorization(authorization)
    artifact, entries = _entries(clean, logical_name)
    if type(bundle_bytes) is not bytes or len(bundle_bytes) != artifact["size"]:
        _reject()
    view = memoryview(bundle_bytes)
    if hashlib.sha256(view).hexdigest() != artifact["digest"]:
        _reject()
    offset, result = 0, []
    for name, member in entries:
        size = member["size"]
        if hashlib.sha256(view[offset:offset + size]).hexdigest() != member["digest"]:
            _reject()
        result.append(BundleMember(member["identity"], member["version"], member["architecture"], name, size, member["digest"]))
        offset += size
    if offset != len(view):
        _reject()
    return tuple(result)

@_bounded
def authorized_source_release(authorization):
    """Expose the immutable source archive identity from Authorization."""
    clean, _ = _authorization(authorization)
    source = clean["artifacts"]["source_release"]
    if not 0 < source["size"] <= _MAX_BUNDLE:
        _reject()
    return SourceRelease(source["size"], source["digest"])

@_bounded
def validate_preparer(authorization, identity, source_bytes):
    """Bind the reviewed dedicated preparer source to its literal digest."""
    _authorization(authorization)
    if type(identity) is not str or identity != _PREPARER_IDENTITY or type(source_bytes) is not bytes or not source_bytes or len(source_bytes) > _MAX_SOURCE:
        _reject()
    digest = hashlib.sha256(source_bytes).hexdigest()
    if digest != _PREPARER_DIGEST:
        _reject()
    return Preparer(identity, digest)

def _prepared(authorization):
    _, manifest = _authorization(authorization)
    projected = dict(manifest)
    projected["sequence"], projected["stage"] = 2, "prepared"
    return checkpoint._encode(projected), manifest

@_bounded
def prepared_checkpoint(authorization):
    return _prepared(authorization)[0]

@_bounded
def validate_prepared_checkpoint(authorization, prepared_bytes):
    expected, manifest = _prepared(authorization)
    if type(prepared_bytes) is not bytes or prepared_bytes != expected:
        _reject()
    return PreparationStatus(manifest["transaction_id"], 2, "prepared")

@_bounded
def preparation_status(authorization, checkpoint_bytes):
    prepared, manifest = _prepared(authorization)
    if type(checkpoint_bytes) is not bytes:
        _reject()
    if checkpoint_bytes == authorization.manifest_bytes:
        return PreparationStatus(manifest["transaction_id"], 1, "manifest_validated")
    if checkpoint_bytes == prepared:
        return PreparationStatus(manifest["transaction_id"], 2, "prepared")
    _reject()

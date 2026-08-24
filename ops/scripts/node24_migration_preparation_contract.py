"""Pure, bounded archive profiles for an authorized Node 24 preparation transaction."""
import hashlib
import json
from collections import namedtuple
from functools import wraps
from typing import NoReturn

from ops.scripts import node24_migration_checkpoint as checkpoint
from ops.scripts import node24_migration_policy as policy

ArchiveProfile = namedtuple(
    "ArchiveProfile",
    "logical_name filename root_name closure_identity version architecture size digest compression",
)
PreparationStatus = namedtuple("PreparationStatus", "transaction_id sequence stage")
_MAX_AUTHORIZATION, _MAX_ARCHIVE = 65536, 512 * 1024**2


class PreparationContractError(ValueError):
    """A bounded error that never includes authorization or archive contents."""


def _reject() -> NoReturn:
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
    if (value != expected or value.policy_bytes != policy._encode(clean_policy)
            or value.manifest_bytes != checkpoint._encode(clean_manifest)):
        _reject()
    return clean_policy, clean_manifest


def _profile(authorization, logical_name):
    if type(logical_name) is not str:
        _reject()
    clean, _ = _authorization(authorization)
    artifact = clean["artifacts"].get(logical_name)
    profiles = {
        "node_target": ("nodejs", "xz"),
        "node_rollback": ("nodejs", "xz"),
        "pm2": ("pm2", "gzip"),
        "source_release": ("source", "gzip"),
    }
    if artifact is None or logical_name not in profiles:
        _reject()
    closure = artifact["closure"]
    if len(closure) != 1 or not 0 < artifact["size"] <= _MAX_ARCHIVE:
        _reject()
    member, (primary, compression) = closure[0], profiles[logical_name]
    if (member["identity"] != primary or member["version"] != artifact["version"]
            or member["architecture"] != artifact["architecture"]
            or member["size"] != artifact["size"] or member["digest"] != artifact["digest"]):
        _reject()
    version = artifact["version"]
    if logical_name in ("node_target", "node_rollback"):
        filename = "node-v%s-linux-x64.tar.xz" % version
        root_name = filename.removesuffix(".tar.xz")
    elif logical_name == "pm2":
        filename = "pm2-7.0.3.tar.gz"
        root_name = "pm2-7.0.3"
    else:
        filename = "release-%s.tar.gz" % version
        root_name = "release-%s" % version
    return ArchiveProfile(
        logical_name, filename, root_name, primary, version, artifact["architecture"],
        artifact["size"], artifact["digest"], compression,
    )


@_bounded
def validate_archive(authorization, logical_name, archive_bytes):
    """Return a sanitized immutable profile only for exact authorized archive bytes."""
    profile = _profile(authorization, logical_name)
    if type(archive_bytes) is not bytes or len(archive_bytes) != profile.size:
        _reject()
    if hashlib.sha256(archive_bytes).hexdigest() != profile.digest:
        _reject()
    return profile


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

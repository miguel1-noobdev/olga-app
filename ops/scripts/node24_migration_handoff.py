"""Publish a completely verified root-staged migration transaction to release ownership."""
import os
from collections import namedtuple
from functools import wraps

from ops.scripts import node24_migration_policy as policy
from ops.scripts import node24_migration_staging as staging

PublishedArtifact = namedtuple("PublishedArtifact", (
    "transaction_id", "policy_digest", "logical_name", "digest", "size", "relative_identity"))


class HandoffError(ValueError):
    """A bounded failure that does not disclose the migration filesystem."""


def _reject():
    raise HandoffError("invalid migration handoff") from None


def _bounded(function):
    @wraps(function)
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except BaseException as error:
            if isinstance(error, HandoffError):
                raise HandoffError("invalid migration handoff") from None
            raise HandoffError("invalid migration handoff") from None
    return call


def _close(nodes):
    """Close every retained descriptor, retrying a transient close failure."""
    if nodes is not None and not nodes.close(False):
        nodes.close(False)
        _reject()


def _same_inode(info, expected):
    return (info.st_dev, info.st_ino) == expected


def _named(parent, name, descriptor):
    staging._stable(((parent, name, descriptor),))



def _verify_bundle(parent, name, item, uid, gid, mode, *, durable=False):
    nodes = staging._FDs()
    try:
        descriptor = nodes.open(name, staging._FLAGS, dir_fd=parent)
        info = os.fstat(descriptor)
        staging._regular(info, uid, gid, item["size"], mode)
        staging._digest(descriptor, item["size"], item["digest"])
        if durable:
            os.fsync(descriptor)
        staging._regular(os.fstat(descriptor), uid, gid, item["size"], mode)
        _named(parent, name, descriptor)
        return policy._metadata(os.fstat(descriptor))
    finally:
        _close(nodes)


def _release_bundle(parent, name, item, ownership, modes, changed):
    nodes = staging._FDs()
    descriptor = None
    try:
        descriptor = nodes.open(name, staging._FLAGS, dir_fd=parent)
        info = os.fstat(descriptor)
        staging._regular(info, ownership["staging_uid"], ownership["staging_gid"], item["size"], modes["staged_bundle"])
        staging._digest(descriptor, item["size"], item["digest"])
        _named(parent, name, descriptor)
        original = (info.st_dev, info.st_ino)
        os.fchown(descriptor, ownership["release_uid"], ownership["release_gid"])
        changed.append((name, original))
        os.fchmod(descriptor, modes["staged_bundle"])
        os.fsync(descriptor)
        staging._regular(os.fstat(descriptor), ownership["release_uid"], ownership["release_gid"], item["size"], modes["staged_bundle"])
        os.lseek(descriptor, 0, os.SEEK_SET)
        staging._digest(descriptor, item["size"], item["digest"])
        _named(parent, name, descriptor)
    finally:
        _close(nodes)


def _restore(parent, changed, ownership, modes):
    for name, expected in reversed(changed):
        nodes = staging._FDs()
        try:
            descriptor = nodes.open(name, staging._FLAGS, dir_fd=parent)
            if _same_inode(os.fstat(descriptor), expected):
                os.fchown(descriptor, ownership["staging_uid"], ownership["staging_gid"])
                os.fchmod(descriptor, modes["staged_bundle"])
                os.fsync(descriptor)
                _named(parent, name, descriptor)
        except BaseException:
            continue
        finally:
            staging._attempt(lambda: nodes.close(False), False)
            staging._attempt(lambda: nodes.close(False), False)


def _inventory(parent, artifacts):
    if set(os.listdir(parent)) != set(artifacts):
        _reject()


def _publish_at(authorization, root):
    clean, manifest = staging._authorization(authorization)
    if type(root) is not str or not os.path.isabs(root) or os.path.normpath(root) != root:
        _reject()
    ownership, modes, paths = clean["ownership"], clean["modes"], clean["paths"]
    stage_nodes = transaction_nodes = None
    stage_fd = transaction_fd = None
    changed, handoff_started = [], False
    try:
        stage_nodes = staging._FDs()
        stage_fd, stage_nodes, stage_links = staging._walk(
            root, paths["staging"], ownership["staging_uid"], ownership["staging_gid"], nodes=stage_nodes)
        staging._directory(os.fstat(stage_fd), ownership["staging_uid"], ownership["staging_gid"], 0o755)
        transaction_nodes = staging._FDs()
        transaction_fd = transaction_nodes.open(manifest["transaction_id"], staging._DIR_FLAGS, dir_fd=stage_fd)
        transaction_link = (stage_fd, manifest["transaction_id"], transaction_fd)
        staging._directory(os.fstat(transaction_fd), ownership["staging_uid"], ownership["staging_gid"], modes["private_workspace"])
        staging._stable(stage_links + [transaction_link])
        artifacts = clean["artifacts"]
        _inventory(transaction_fd, artifacts)
        prepared = {}
        for name, item in sorted(artifacts.items()):
            prepared[name] = _verify_bundle(transaction_fd, name, item, ownership["staging_uid"], ownership["staging_gid"], modes["staged_bundle"], durable=True)
        os.fsync(transaction_fd)
        staging._stable(stage_links + [transaction_link])
        os.fsync(stage_fd)
        _inventory(transaction_fd, artifacts)
        if any(not staging._same_named(transaction_fd, name, expected) for name, expected in prepared.items()):
            _reject()
        staging._stable(stage_links + [transaction_link])
        result = tuple(PublishedArtifact(manifest["transaction_id"], authorization.policy_digest, name,
                       item["digest"], item["size"], manifest["transaction_id"] + "/" + name)
                       for name, item in sorted(artifacts.items()))
        for name, item in sorted(artifacts.items()):
            _release_bundle(transaction_fd, name, item, ownership, modes, changed)
        _inventory(transaction_fd, artifacts)
        for name, item in sorted(artifacts.items()):
            _verify_bundle(transaction_fd, name, item, ownership["release_uid"], ownership["release_gid"], modes["staged_bundle"], durable=False)
        staging._stable(stage_links + [transaction_link])
        os.fchown(transaction_fd, ownership["release_uid"], ownership["release_gid"])
        handoff_started = True
        os.fchmod(transaction_fd, modes["private_workspace"])
        os.fsync(transaction_fd)
        staging._directory(os.fstat(transaction_fd), ownership["release_uid"], ownership["release_gid"], modes["private_workspace"])
        staging._stable(stage_links + [transaction_link])
        os.fsync(stage_fd)
        _close(transaction_nodes)
        transaction_nodes = None
        _close(stage_nodes)
        stage_nodes = None
        return result
    except BaseException:
        if not handoff_started and transaction_fd is not None:
            _restore(transaction_fd, changed, ownership, modes)
        staging._attempt(lambda: _close(transaction_nodes), False)
        staging._attempt(lambda: _close(stage_nodes), False)
        _reject()


_publish_at = _bounded(_publish_at)


@_bounded
def publish_verified_staging(authorization):
    if os.geteuid() != 0 or os.getegid() != 0:
        _reject()
    clean, _ = staging._authorization(authorization)
    if clean["ownership"]["staging_uid"] != 0 or clean["ownership"]["staging_gid"] != 0:
        _reject()
    return _publish_at(authorization, "/")

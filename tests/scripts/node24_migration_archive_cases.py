"""Readable boundary cases for authenticated migration archive parsing."""
import hashlib
import io
import lzma
import sys
import tarfile
import unittest
import zlib
from contextlib import contextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ops.scripts import node24_migration_policy as policy
from ops.scripts import node24_migration_preparation_contract as contract
from ops.scripts import node24_migration_archive as archive


ROOT = "node-v24.19.0-linux-x64"
PM2_ROOT = "pm2-7.0.3"


def compress(raw, kind):
    return lzma.compress(raw) if kind == "xz" else zlib.compress(raw, wbits=31)


def tar_bytes(entries, format=tarfile.USTAR_FORMAT):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:", format=format) as bundle:
        for name, kind, data, mode in entries:
            member = tarfile.TarInfo(name)
            member.type, member.mode = kind, mode
            if kind == tarfile.SYMTYPE or kind == tarfile.LNKTYPE:
                member.linkname = data
            elif kind == tarfile.REGTYPE:
                member.size = len(data)
                data = io.BytesIO(data)
            bundle.addfile(member, data if kind == tarfile.REGTYPE else None)
    return output.getvalue()


def authorization(raw, logical_name="node_target"):
    digest = hashlib.sha256(raw).hexdigest()
    identities = {
        "node_target": ("24.19.0", "amd64", "nodejs"),
        "node_rollback": ("20.20.2", "amd64", "nodejs"),
        "pm2": ("7.0.3", "all", "pm2"),
        "source_release": ("a" * 40, "all", "source"),
    }
    paths = {"checkpoint": "/m/checkpoint", "lock": "/m/checkpoint.lock",
             "artifacts": "/m/artifacts", "staging": "/m/staging", "app": "/app",
             "releases": "/app/releases", "current": "/app/current", "preparer": "/m/staging/preparer"}
    artifacts, manifest_artifacts = {}, {}
    for name, (version, architecture, identity) in identities.items():
        item = {"identity": identity, "version": version, "architecture": architecture,
                "size": len(raw), "digest": digest}
        artifacts[name] = dict(item, identity="/m/artifacts/" + name, closure=[item])
        manifest_artifacts[name] = {key: artifacts[name][key] for key in ("identity", "digest")}
        if name != "source_release":
            manifest_artifacts[name].update(version=version, architecture=architecture)
    value = {"schema": "botanica-ob.node24-migration-policy.v1", "candidate_sha": "a" * 40,
             "rollback_sha": "b" * 40, "paths": paths,
             "ownership": dict.fromkeys(("artifact_uid", "artifact_gid", "staging_uid", "staging_gid", "release_uid", "release_gid"), 0),
             "modes": {"managed_root": 0o755, "artifact": 0o600, "private_workspace": 0o700, "staged_bundle": 0o600, "initial_release": 0o755, "sealed_release": 0o555},
             "limits": {"max_bundle_size": max(1, len(raw)), "max_total_size": max(4, 4 * len(raw))},
             "units": {"canonical": "x.service", "authorized": ["x.service"]}, "artifacts": artifacts}
    manifest = {"transaction_id": "node24-test", "sequence": 1, "stage": "manifest_validated",
                "candidate_sha": "a" * 40, "rollback_sha": "b" * 40, "artifacts": manifest_artifacts,
                "paths": {"checkpoint": paths["checkpoint"], "lock": paths["lock"], "runtime_staging": paths["staging"], "candidate_release": "/app/releases/" + "a" * 40, "rollback_release": "/app/releases/" + "b" * 40, "current_link": paths["current"]}, "units": value["units"]}
    return policy.authorize_manifest(value, manifest)


@contextmanager
def patched(object_, name, value):
    original = getattr(object_, name)
    setattr(object_, name, value)
    try:
        yield
    finally:
        setattr(object_, name, original)


class ArchiveStructureCases(unittest.TestCase):
    def valid(self, kind="xz", root=ROOT):
        return compress(tar_bytes([(root + "/", tarfile.DIRTYPE, None, 0o755),
            (root + "/bin/", tarfile.DIRTYPE, None, 0o755),
            (root + "/bin/node", tarfile.REGTYPE, b"node", 0o711),
            (root + "/npm", tarfile.SYMTYPE, "bin/node", 0o777)]), kind)

    def parsed(self, raw, name="node_target"):
        return archive.validate_archive_structure(authorization(raw, name), name, raw)

    def rejects(self, raw, name="node_target"):
        with self.assertRaisesRegex(archive.ArchiveError, "^invalid migration archive$"):
            self.parsed(raw, name)

    def test_parses_gzip_and_xz_profiles_into_immutable_normalized_plan(self):
        xz = self.parsed(self.valid())
        gzip = self.parsed(self.valid("gzip", PM2_ROOT), "pm2")
        self.assertEqual((xz.logical_name, xz.root_name, xz.total_size), ("node_target", ROOT, 4))
        self.assertEqual([(m.relative_name, m.kind, m.mode, m.link_target) for m in xz.members],
                         [("bin", "directory", 0o755, None), ("bin/node", "regular", 0o755, None), ("npm", "symlink", None, "bin/node")])
        self.assertEqual(gzip.root_name, PM2_ROOT)
        with self.assertRaises(AttributeError):
            xz.members += ()
        with self.assertRaises(AttributeError):
            xz.members[0].mode = 0

    def test_rejects_compression_framing_and_expansion_failures(self):
        raw = self.valid()
        self.rejects(raw[:-1])
        self.rejects(raw + b"trailing")
        self.rejects(raw + raw)
        self.rejects(self.valid("gzip"))
        expanding = compress(b"x" * 5, "xz")
        with patched(archive, "_MAX_EXPANSION", 4):
            self.rejects(expanding)

    def test_rejects_invalid_raw_headers_and_every_forbidden_type(self):
        plain = bytearray(tar_bytes([(ROOT + "/", tarfile.DIRTYPE, None, 0o755)]))
        plain[148] ^= 1
        self.rejects(compress(bytes(plain), "xz"))
        plain = bytearray(tar_bytes([(ROOT + "/", tarfile.DIRTYPE, None, 0o755)]))
        plain[-1] = 1
        self.rejects(compress(bytes(plain), "xz"))
        for kind in (tarfile.GNUTYPE_LONGNAME, tarfile.GNUTYPE_LONGLINK, tarfile.XGLTYPE,
                     tarfile.XHDTYPE, tarfile.LNKTYPE, tarfile.CHRTYPE, tarfile.BLKTYPE,
                     tarfile.FIFOTYPE, b"S", b"Z"):
            self.rejects(compress(tar_bytes([(ROOT + "/", tarfile.DIRTYPE, None, 0o755),
                         (ROOT + "/bad", kind, "target", 0o644)]), "xz"))

    def test_rejects_root_names_and_topology_collisions(self):
        cases = [[("wrong/", tarfile.DIRTYPE, None, 0o755)],
                 [(ROOT, tarfile.REGTYPE, b"x", 0o644)],
                 [(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a", tarfile.REGTYPE, b"x", 0o644), (ROOT + "/a", tarfile.REGTYPE, b"y", 0o644)],
                 [(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a/b", tarfile.REGTYPE, b"x", 0o644)],
                 [(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a", tarfile.REGTYPE, b"x", 0o644), (ROOT + "/a/b", tarfile.REGTYPE, b"y", 0o644)]]
        for entries in cases:
            self.rejects(compress(tar_bytes(entries), "xz"))

    def test_rejects_unsafe_names_and_links_independent_of_member_order(self):
        invalid = [ROOT + "/../x", ROOT + "/a\\x", ROOT + "/a\x01", ROOT + "/café"]
        for name in invalid:
            self.rejects(compress(tar_bytes([(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (name, tarfile.REGTYPE, b"x", 0o644)]), "xz"))
        for entries in [[(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a", tarfile.SYMTYPE, "../../escape", 0o777)],
                        [(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a", tarfile.SYMTYPE, "b", 0o777), (ROOT + "/a/x", tarfile.REGTYPE, b"x", 0o644)],
                        [(ROOT + "/", tarfile.DIRTYPE, None, 0o755), (ROOT + "/a/x", tarfile.REGTYPE, b"x", 0o644), (ROOT + "/a", tarfile.SYMTYPE, "b", 0o777)]]:
            self.rejects(compress(tar_bytes(entries), "xz"))

    def test_rejects_member_file_and_total_bounds_and_authentication_mismatches(self):
        with patched(archive, "_MAX_MEMBERS", 1):
            self.rejects(self.valid())
        with patched(archive, "_MAX_FILE", 1):
            self.rejects(self.valid())
        with patched(archive, "_MAX_EXPANSION", 3):
            self.rejects(self.valid())
        raw = self.valid()
        with self.assertRaisesRegex(archive.ArchiveError, "^invalid migration archive$"):
            archive.validate_archive_structure(authorization(raw), "pm2", raw)
        with self.assertRaisesRegex(archive.ArchiveError, "^invalid migration archive$"):
            archive.validate_archive_structure(authorization(raw), "node_target", raw + b"x")


if __name__ == "__main__":
    unittest.main()

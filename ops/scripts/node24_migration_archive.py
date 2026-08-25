"""Pure parser for authenticated Node 24 migration archive structures."""
import lzma
import tempfile
import zlib
from collections import namedtuple
from functools import wraps
from typing import NoReturn

from ops.scripts.node24_migration_preparation_contract import validate_archive

ArchiveMember = namedtuple("ArchiveMember", "relative_name kind mode size link_target")
ArchivePlan = namedtuple("ArchivePlan", "logical_name root_name compression members total_size digest")
_MAX_EXPANSION = 1024 * 1024**2
_MAX_MEMBERS = 4096
_MAX_FILE = 512 * 1024**2
_CHUNK = 65536

class ArchiveError(ValueError):
    """A bounded error which never reports archive or authorization contents."""


def _reject() -> NoReturn:
    raise ArchiveError("invalid migration archive")


def _bounded(function):
    @wraps(function)
    def call(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception:
            raise ArchiveError("invalid migration archive") from None
    return call


def _write(handle, data):
    data = memoryview(data)
    while data:
        count = handle.write(data)
        if type(count) is not int or count <= 0:
            _reject()
        data = data[count:]


def _read(handle, count):
    parts = []
    while count:
        part = handle.read(count)
        if not part:
            _reject()
        parts.append(part)
        count -= len(part)
    return b"".join(parts)


def _decompress(raw, compression):
    output = tempfile.TemporaryFile()
    try:
        if compression == "gzip":
            decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
        elif compression == "xz":
            decompressor = lzma.LZMADecompressor(format=lzma.FORMAT_XZ)
        else:
            _reject()
        total = 0
        for offset in range(0, len(raw), _CHUNK):
            data = raw[offset:offset + _CHUNK]
            while data or (compression == "xz" and not getattr(decompressor, "needs_input", False)):
                piece = decompressor.decompress(data, _CHUNK)
                data = getattr(decompressor, "unconsumed_tail", b"")
                total += len(piece)
                if total > _MAX_EXPANSION:
                    _reject()
                _write(output, piece)
                if decompressor.eof:
                    if decompressor.unused_data or data or offset + _CHUNK < len(raw):
                        _reject()
                    break
                if compression == "gzip" and not data:
                    break
                if compression == "xz" and getattr(decompressor, "needs_input", False):
                    break
            if decompressor.eof:
                break
        if not decompressor.eof:
            _reject()
        output.seek(0)
        return output
    except Exception:
        output.close()
        raise


def _number(field):
    value = field.rstrip(b"\0 ").lstrip(b" ")
    if not value or any(byte not in b"01234567" for byte in value):
        _reject()
    return int(value, 8)


def _text(field):
    value, _, padding = field.partition(b"\0")
    if padding and padding.strip(b"\0"):
        _reject()
    try:
        return value.decode("ascii")
    except UnicodeDecodeError:
        _reject()


def _name(value, root, directory=False):
    if directory and value.endswith("/"):
        value = value[:-1]
    if (not value or value.startswith("/") or "\\" in value
            or any(ord(char) < 32 or ord(char) > 126 for char in value)):
        _reject()
    parts = tuple(value.split("/"))
    if any(part in ("", ".", "..") for part in parts) or parts[0] != root:
        _reject()
    return parts


def _link(value, parent, root):
    if (not value or value.startswith("/") or "\\" in value
            or any(ord(char) < 32 or ord(char) > 126 for char in value)):
        _reject()
    resolved = list(parent)
    for part in value.split("/"):
        if part in ("", "."):
            _reject()
        if part == "..":
            if len(resolved) <= 1:
                _reject()
            resolved.pop()
        else:
            resolved.append(part)
    if not resolved or resolved[0] != root:
        _reject()


def _headers(handle, root):
    handle.seek(0, 2)
    size = handle.tell()
    if not size or size % 512:
        _reject()
    handle.seek(0)
    records, offset, zeros = [], 0, 0
    while offset < size:
        block = _read(handle, 512)
        offset += 512
        if block == b"\0" * 512:
            zeros += 1
            if zeros == 2:
                while offset < size:
                    count = min(512, size - offset)
                    if _read(handle, count) != b"\0" * count:
                        _reject()
                    offset += count
                return records
            continue
        if zeros or sum(block[:148]) + 8 * 32 + sum(block[156:]) != _number(block[148:156]):
            _reject()
        kind = block[156:157]
        if kind not in (b"\0", b"0", b"5", b"2") or len(records) >= _MAX_MEMBERS:
            _reject()
        entry_size, raw_mode = _number(block[124:136]), _number(block[100:108])
        directory = kind == b"5"
        name = _text(block[0:100])
        prefix = _text(block[345:500])
        parts = _name((prefix + "/" if prefix else "") + name, root, directory)
        target = _text(block[157:257]) if kind == b"2" else None
        if kind in (b"5", b"2") and entry_size:
            _reject()
        if kind == b"2":
            _link(target, parts[:-1], root)
        records.append((parts, kind, raw_mode, entry_size, target))
        data_size = (entry_size + 511) // 512 * 512
        if offset + data_size > size:
            _reject()
        handle.seek(data_size, 1)
        offset += data_size
    _reject()


def _plan(profile, handle):
    records = _headers(handle, profile.root_name)
    if not records:
        _reject()
    indexed, total = {}, 0
    for parts, kind, raw_mode, size, target in records:
        if parts in indexed:
            _reject()
        if kind in (b"\0", b"0"):
            if size > _MAX_FILE:
                _reject()
            total += size
            if total > _MAX_EXPANSION:
                _reject()
            item = ("regular", 0o755 if raw_mode & 0o111 else 0o644, size, None)
        elif kind == b"5":
            item = ("directory", 0o755, 0, None)
        else:
            item = ("symlink", None, 0, target)
        indexed[parts] = item
    root = (profile.root_name,)
    if indexed.get(root, (None,))[0] != "directory":
        _reject()
    for parts, item in indexed.items():
        for length in range(1, len(parts)):
            parent = indexed.get(parts[:length])
            if parent is None or parent[0] != "directory":
                _reject()
    members = tuple(ArchiveMember("/".join(parts[1:]), *indexed[parts])
                    for parts in sorted(indexed) if parts != root)
    return ArchivePlan(profile.logical_name, profile.root_name, profile.compression,
                       members, total, profile.digest)


@_bounded
def validate_archive_structure(authorization, logical_name, raw):
    """Authenticate and parse an archive without exposing its temporary contents."""
    profile = validate_archive(authorization, logical_name, raw)
    with _decompress(raw, profile.compression) as handle:
        return _plan(profile, handle)

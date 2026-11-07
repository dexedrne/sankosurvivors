"""Package only the audited casual bytes; no account, upload or publishing action."""
import hashlib
import json
import pathlib
import sys
import tempfile
import zipfile


def package(root, manifest, output):
    root = pathlib.Path(root).resolve()
    output = pathlib.Path(output).resolve()
    assert not output.is_relative_to(root), 'Archive must be outside the game folder'
    rows = json.loads(pathlib.Path(manifest).read_text())['files']
    names = [row['name'] for row in rows]
    assert len(set(names)) == len(names) and 'index.html' in names, 'Invalid inventory'
    for name in names:
        path = pathlib.PurePosixPath(name)
        assert not path.is_absolute() and all(part not in ('..', '.') and not part.startswith('.') for part in path.parts), 'Unsafe upload path'
        assert name in ('index.html', 'licenses/run-escape.txt') or path.parts[0] in ('assets', 'draco'), 'Unexpected upload file'
    actual = []
    for path in root.rglob('*'):
        assert not path.is_symlink(), 'Upload symlink refused'
        if path.is_file():
            actual.append(path.relative_to(root).as_posix())
    assert set(names) == set(actual), 'Upload inventory changed'
    assert sum(row['bytes'] for row in rows) <= 1_000_000_000, 'Upload too large'
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + '.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for row in sorted(rows, key=lambda row: row['name']):
                data = (root / row['name']).read_bytes()
                assert len(data) == row['bytes'] and hashlib.sha256(data).hexdigest() == row['sha256'], 'Audited game bytes changed'
                info = zipfile.ZipInfo(row['name'], date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data, compresslevel=6)
        with zipfile.ZipFile(temporary) as archive:
            assert archive.testzip() is None and sorted(archive.namelist()) == sorted(names), 'Archive self-check failed'
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    return {'file': output.name, 'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'files': len(rows)}


def self_test():
    with tempfile.TemporaryDirectory(prefix='sqs-wavedash-package-') as temporary:
        root = pathlib.Path(temporary) / 'game'
        root.mkdir()
        (root / 'index.html').write_text('game')
        manifest = pathlib.Path(temporary) / 'manifest.json'
        manifest.write_text(json.dumps({'files': [{'name': 'index.html', 'bytes': 4, 'sha256': hashlib.sha256(b'game').hexdigest()}]}))
        output = pathlib.Path(temporary) / 'game.zip'
        first = package(root, manifest, output)
        assert package(root, manifest, output) == first, 'Archive is not reproducible'
        (root / 'index.html').write_text('changed')
        try:
            package(root, manifest, output)
        except AssertionError as error:
            assert str(error) == 'Audited game bytes changed'
        else:
            raise AssertionError('Changed bytes were accepted')
        assert hashlib.sha256(output.read_bytes()).hexdigest() == first['sha256'], 'Failed packaging replaced good archive'
        (root / 'extra').symlink_to(root / 'index.html')
        try:
            package(root, manifest, output)
        except AssertionError as error:
            assert str(error) == 'Upload symlink refused'
        else:
            raise AssertionError('Symlink was accepted')
    print('PASS deterministic ZIP, changed-byte refusal, retained good archive, symlink refusal')


if __name__ == '__main__':
    if sys.argv[1:] == ['--self-test']:
        self_test()
    else:
        print(json.dumps(package(*sys.argv[1:]), indent=2))

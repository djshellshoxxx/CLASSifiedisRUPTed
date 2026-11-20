from pathlib import Path
import gzip
import hashlib
import json

raw = Path('/workspace/scratch/e0ea2385d962/classrup-validation')
target = raw.parent / 'ClassRup-restore-rejection-proof/docs/development/cycles/20261120-restore-rejection-proof/evidence'
folders = ['g16-setup', 'g16-final']
files = [path for folder in folders for path in sorted((raw / folder).glob('*')) if path.is_file()]
files += [raw / name for name in [
    'g16-source.json', 'g16-toolchain.json', 'g16-parent-hosted-observation.json',
    'publication-g12-post-preservation.json', 'run_g16.py', 'archive_g16.py',
]]
target.mkdir(parents=True, exist_ok=True)
entries = []
for source in files:
    original = source.read_bytes()
    relative = source.relative_to(raw)
    compress = source.suffix == '.log' or (source.suffix == '.json' and 'testResults' in json.loads(original))
    stored = gzip.compress(original, compresslevel=9, mtime=0) if compress else original
    destination = target / (str(relative) + ('.gz' if compress else ''))
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(stored)
    assert (gzip.decompress(destination.read_bytes()) if compress else destination.read_bytes()) == original
    entries.append({
        'source_path': str(relative), 'archived_path': str(destination.relative_to(target)),
        'encoding': 'gzip' if compress else 'identity',
        'original_bytes': len(original), 'stored_bytes': len(stored),
        'original_sha256': hashlib.sha256(original).hexdigest(),
        'stored_sha256': hashlib.sha256(stored).hexdigest(),
    })
manifest = {
    'format': 'validation-evidence-archive/v1',
    'executed_source': '53aa9fe93c8599c41c0b9b2df4f438b969f14ce9',
    'executed_tree': '81a97a7be19975fe653bce41bda5d7e0991efcbb',
    'base_published_source': '6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2',
    'entries': entries,
    'total_original_bytes': sum(entry['original_bytes'] for entry in entries),
    'total_stored_bytes': sum(entry['stored_bytes'] for entry in entries),
    'note': 'The new targeted pass does not replace parent full-run failures or establish hosted/native qualification. Parent evidence remains in its original cycle.',
}
receipt = target / 'archive-receipt.json'
receipt.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'entries': len(entries),
                  'original_bytes': manifest['total_original_bytes'],
                  'stored_bytes': manifest['total_stored_bytes'],
                  'manifest_sha256': hashlib.sha256(receipt.read_bytes()).hexdigest()}))

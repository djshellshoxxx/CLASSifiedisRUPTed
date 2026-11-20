from pathlib import Path
import gzip
import hashlib
import json

raw = Path('/workspace/scratch/e0ea2385d962/classrup-validation')
target = raw.parent / 'ClassRup-pwa-recovery-consolidation/docs/development/cycles/20261120-pwa-recovery-consolidation/evidence'
folders = ['g19-setup', 'g19-final']
files = [path for folder in folders for path in sorted((raw / folder).glob('*')) if path.is_file()]
files += [raw / name for name in [
    'g19-source.json', 'g19-toolchain.json', 'g19-parent-hosted-observation.json',
    'g19-parent-synthetic-merge.json',
    'publication-g16-post-preservation.json', 'publication-g16-state.json',
    'g19-pwa-standards.md', 'g19-pwa-spec.md', 'g19-pwa-defensive.md',
    'run_g19.py', 'archive_g19.py',
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
    'executed_source': '9cf6c56c9b65a421a95676f89e9fcc3800bca573',
    'executed_tree': 'f506c9282299b034cef6b540017e49ffeac88362',
    'base_published_source': 'b89e7047ea352a3d47703b134c6c12a7ea589a04',
    'entries': entries,
    'total_original_bytes': sum(entry['original_bytes'] for entry in entries),
    'total_stored_bytes': sum(entry['stored_bytes'] for entry in entries),
    'note': 'Current selected results remain separate from parent full-run failures and do not establish hosted or native-browser qualification. Incoming branches, reviews and original evidence remain preserved.',
}
receipt = target / 'archive-receipt.json'
receipt.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'entries': len(entries),
                  'original_bytes': manifest['total_original_bytes'],
                  'stored_bytes': manifest['total_stored_bytes'],
                  'manifest_sha256': hashlib.sha256(receipt.read_bytes()).hexdigest()}))

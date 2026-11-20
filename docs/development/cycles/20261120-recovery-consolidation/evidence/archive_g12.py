from pathlib import Path
import gzip, hashlib, json

raw=Path('/workspace/scratch/e0ea2385d962/classrup-validation')
target=raw.parent/'ClassRup-recovery-consolidation/docs/development/cycles/20261120-recovery-consolidation/evidence'
target.mkdir(parents=True,exist_ok=True)
folders=['g12-consolidation-baseline','g12-baseline','g12-final-round1','g12-isolated-budget','g12-remaining-round1','g12-isolated-vault','g12-final-other','g12-auxiliary']
files=[p for folder in folders for p in sorted((raw/folder).glob('*')) if p.is_file()]
files += [raw/name for name in ['g12-main-observation.json','g12-main-domain.log','g12-pr68-predecessor-observation.json','g12-pr68-failed-domain.log','g12-toolchain.json','g12-offline-install-observation.json','g12-runner-observations.json','run_g12.py','finish_g12.py','complete_g12.py','run_auxiliary_g12.py','archive_g12.py']]
records=[]
for source in files:
    data=source.read_bytes(); rel=source.relative_to(raw)
    compress=source.suffix=='.log' or (source.suffix=='.json' and 'testResults' in json.loads(data))
    stored=gzip.compress(data,compresslevel=9,mtime=0) if compress else data
    destination=target/(str(rel)+('.gz' if compress else ''))
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(stored)
    assert (gzip.decompress(destination.read_bytes()) if compress else destination.read_bytes())==data
    records.append({'source_path':str(rel),'archived_path':str(destination.relative_to(target)),'encoding':'gzip' if compress else 'identity','original_bytes':len(data),'stored_bytes':len(stored),'original_sha256':hashlib.sha256(data).hexdigest(),'stored_sha256':hashlib.sha256(stored).hexdigest()})
manifest={'format':'validation-evidence-archive/v1','executed_combined_source':'d55bb48117c0f9e4579b01fd6c12030585601d68','entries':records,'total_original_bytes':sum(r['original_bytes'] for r in records),'total_stored_bytes':sum(r['stored_bytes'] for r in records),'note':'Decoded GitHub logs are captured as UTF-8. Failed, cancelled and passing observations retain their own source identities; counts are not additive.'}
(target/'archive-receipt.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'entries':len(records),'original_bytes':manifest['total_original_bytes'],'stored_bytes':manifest['total_stored_bytes'],'manifest_sha256':hashlib.sha256((target/'archive-receipt.json').read_bytes()).hexdigest()}))

from pathlib import Path
import json, runpy, sys

sys.argv = ['run_g12.py', 'remaining-round1']
state = runpy.run_path('/workspace/scratch/e0ea2385d962/classrup-validation/run_g12.py')
root, out = state['ROOT'], state['OUT']
first = root.parent / 'classrup-validation/g12-final-round1'
failures = []
for shard in range(2, 9):
    if state['domain']('domain-' + str(shard), [], str(shard) + '/8'):
        failures.append(shard)
expected = json.loads((first / 'expected-domain-files.json').read_text())
reported, cases = [], []
for shard in range(1, 9):
    report = (first if shard == 1 else out) / ('domain-' + str(shard) + '.json')
    if not report.exists():
        continue
    for suite in json.loads(report.read_text())['testResults']:
        path = str(Path(suite['name']).relative_to(root))
        reported.append(path)
        cases.extend({'file': path, 'name': case['fullName'], 'status': case['status'], 'duration_ms': case.get('duration')} for case in suite['assertionResults'])
recount = {'source': state['SOURCE'], 'tree': state['TREE'], 'expected_files': len(expected), 'reported_files': len(reported), 'missing': sorted(set(expected)-set(reported)), 'unexpected': sorted(set(reported)-set(expected)), 'duplicate_files':len(reported)-len(set(reported)), 'cases':len(cases), 'passed':sum(case['status']=='passed' for case in cases), 'nonpassing':[case for case in cases if case['status']!='passed'], 'duplicate_cases':len(cases)-len(set((case['file'],case['name']) for case in cases)), 'later_failed_shards': failures}
(out/'domain-recount.json').write_text(json.dumps(recount,indent=2)+'\n')
print(json.dumps(recount),flush=True)
assert not recount['missing'] and not recount['unexpected'] and not recount['duplicate_files'] and not recount['duplicate_cases']
for name, command in [('tooling',['node','--test',*sorted(str(p.relative_to(root)) for p in root.glob('tests/tooling/*.test.mjs'))]),('cli',['node','--test',*sorted(str(p.relative_to(root)) for p in root.glob('tests/cli/*.test.mjs'))]),('setup',['node','tools/cli/classrup.mjs','setup','--non-interactive']),('build',['node','tools/cli/classrup.mjs','build'])]:
    state['check'](name,command)

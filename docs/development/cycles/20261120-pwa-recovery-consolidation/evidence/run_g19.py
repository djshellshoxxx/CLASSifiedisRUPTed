from pathlib import Path
import datetime, hashlib, json, os, signal, subprocess, sys, time

ROOT = Path('/workspace/scratch/e0ea2385d962/ClassRup-pwa-recovery-consolidation')
PHASE = sys.argv[1]
OUT = ROOT.parent / 'classrup-validation' / ('g19-' + PHASE)
OUT.mkdir(parents=True, exist_ok=True)
ENV = {**os.environ, 'GOMAXPROCS': '1', 'GOMEMLIMIT': '384MiB', 'NODE_OPTIONS': '--max-old-space-size=1024'}
SOURCE = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
TREE = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=ROOT, text=True).strip()
FILES = ['tests/integration/attachment-reference-coverage.test.ts', 'tests/integration/production-future-codec-rejection.test.ts', 'tests/integration/production-downgrade-export.test.ts', 'tests/integration/production-foreign-codec-isolation.test.ts']
CHECKS = []

def check(name, command, timeout=900):
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == SOURCE
    dirty = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD'], cwd=ROOT, text=True).splitlines()
    assert all(path.startswith('docs/') for path in dirty), dirty
    start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
    timed_out = False
    with (OUT / (name + '.log')).open('wb') as log:
        proc = subprocess.Popen(command, cwd=ROOT, env=ENV, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
            os.killpg(proc.pid, signal.SIGKILL)
            code = proc.wait()
    data = (OUT / (name + '.log')).read_bytes()
    receipt = {'name': name, 'command': command, 'source': SOURCE, 'tree': TREE, 'started_at': start, 'duration_seconds': round(time.monotonic() - tick, 3), 'timeout_seconds': timeout, 'timed_out': timed_out, 'exit_code': code, 'environment': {key: ENV[key] for key in ['GOMAXPROCS', 'GOMEMLIMIT', 'NODE_OPTIONS']}, 'log_bytes': len(data), 'log_sha256': hashlib.sha256(data).hexdigest()}
    (OUT / (name + '-receipt.json')).write_text(json.dumps(receipt, indent=2) + '\n')
    CHECKS.append(receipt)
    (OUT / 'summary.json').write_text(json.dumps({'source': SOURCE, 'tree': TREE, 'checks': CHECKS}, indent=2) + '\n')
    print(json.dumps(receipt), flush=True)
    if code:
        print(data.decode(errors='replace')[-5000:], flush=True)
    return code

def domain(name, files, shard=None):
    report = OUT / (name + '.json')
    command = ['node', 'node_modules/vitest/vitest.mjs', 'run', *files, '--pool=forks', '--maxWorkers=1', '--fileParallelism=false', '--reporter=json', '--outputFile=' + str(report)]
    if shard:
        command.append('--shard=' + shard)
    code = check(name, command)
    if report.exists():
        parsed = json.loads(report.read_text())
        cases = [a for suite in parsed['testResults'] for a in suite['assertionResults']]
        print(json.dumps({'report': name, 'files': len(parsed['testResults']), 'passed': sum(a['status'] == 'passed' for a in cases), 'failed': sum(a['status'] == 'failed' for a in cases), 'other': sum(a['status'] not in ['passed', 'failed'] for a in cases)}), flush=True)
    return code

if PHASE == 'setup':
    sys.exit(check('install', ['corepack','pnpm','install','--offline','--frozen-lockfile']))
if PHASE != 'final':
    raise ValueError('Unknown phase: ' + PHASE)
if domain('focused', ['tests/integration/backup-coverage.test.ts', 'tests/integration/attachment-reference-coverage.test.ts', 'tests/integration/production-future-codec-rejection.test.ts', 'tests/integration/production-downgrade-export.test.ts', 'tests/integration/production-foreign-codec-isolation.test.ts', 'tests/integration/vault-session.test.ts']):
    sys.exit(1)
commands = [
    ('typecheck', ['node','node_modules/typescript/bin/tsc','-p','tsconfig.json','--noEmit']),
    ('spec', ['node','tools/specgen/specgen.mjs','check']),
    ('deps', ['node','tools/deps/deps.mjs']),
    ('registry', ['node','packages/platform/scripts/gen-registry.mjs','--check','--strict']),
    ('tooling', ['node','--test',*sorted(str(p.relative_to(ROOT)) for p in ROOT.glob('tests/tooling/*.test.mjs'))]),
    ('cli', ['node','--test',*sorted(str(p.relative_to(ROOT)) for p in ROOT.glob('tests/cli/*.test.mjs'))]),
    ('setup', ['node','tools/cli/classrup.mjs','setup','--non-interactive']),
    ('build', ['node','tools/cli/classrup.mjs','build']),
]
for name, command in commands:
    if check(name, command):
        sys.exit(1)
print(json.dumps({'source':SOURCE,'tree':TREE,'all_requested_checks_completed':True}),flush=True)

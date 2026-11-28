import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'tools/cli/classrup.mjs');
const declaredVersion = '0.0.0-development';
const canary = 'private-version-fixture\u001b[31m';
const usage = 'Use --version [--json]. See --help.';
const unavailable = 'Checkout version is unavailable. Restore the tracked package.json.';
const success = version => ({ schemaVersion: 1, command: 'version', ok: true,
  name: 'classrup', version, releaseStatus: 'unreleased' });

function run(selectedScript, args, cwd, nodeOptions = []) {
  const result = spawnSync(process.execPath, [...nodeOptions, selectedScript, ...args], {
    cwd, encoding: 'utf8', timeout: 15000, maxBuffer: 64 * 1024,
    // Help/version do not need the workspace's package manager or dependencies.
    env: { ...process.env, npm_config_user_agent: 'npm/11.0.0' },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup version with spaces '));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const checkout = path.join(directory, 'unreleased checkout');
  const cwd = path.join(directory, 'unrelated working directory');
  const selectedScript = path.join(checkout, 'tools/cli/classrup.mjs');
  await fs.mkdir(path.dirname(selectedScript), { recursive: true });
  await fs.mkdir(cwd);
  await fs.copyFile(script, selectedScript);
  await fs.copyFile(path.join(root, 'package.json'), path.join(checkout, 'package.json'));
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({ name: canary, version: canary }));
  return { directory, checkout, cwd, script: selectedScript };
}

function reject(result, code, status, json, message) {
  assert.equal(result.status, status, result.stderr);
  if (json) {
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(result.stdout), {
      schemaVersion: 1, command: 'version', ok: false, error: { code, message },
    });
    assert.equal(result.stdout.split('\n').length, 2);
  } else {
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `ClassRup: ${code}: ${message}\n`);
  }
  assert.ok(!`${result.stdout}${result.stderr}`.includes('private-version-fixture'));
}

test('checkout version reports one unreleased version in human and JSON output', () => {
  const human = run(script, ['--version'], root);
  assert.equal(human.status, 0, human.stderr);
  assert.equal(human.stdout, `ClassRup ${declaredVersion} (unreleased checkout)\n`);
  assert.equal(human.stderr, '');
  const json = run(script, ['--version', '--json'], root);
  assert.equal(json.status, 0, json.stderr);
  assert.equal(json.stderr, '');
  assert.equal(json.stdout, `${JSON.stringify(success(declaredVersion))}\n`);
});

test('version uses checkout metadata from arbitrary paths without setup or node_modules', async t => {
  const selected = await fixture(t);
  // Change only the checkout manifest to prove that it is the version authority.
  const version = '1.2.3-development.fixture';
  await fs.writeFile(path.join(selected.checkout, 'package.json'), JSON.stringify({ name: 'classrup', version }));
  const before = await fs.readdir(selected.directory, { recursive: true });
  for (const json of [false, true]) {
    const result = run(selected.script, ['--version', ...(json ? ['--json'] : [])], selected.cwd);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, json ? `${JSON.stringify(success(version))}\n`
      : `ClassRup ${version} (unreleased checkout)\n`);
  }
  assert.deepEqual(await fs.readdir(selected.directory, { recursive: true }), before);
  await assert.rejects(fs.access(path.join(selected.checkout, 'node_modules')), { code: 'ENOENT' });
  await assert.rejects(fs.access(path.join(selected.checkout, '.classrup')), { code: 'ENOENT' });
});

test('version runs through a directory alias while an ordinary import remains inert', async t => {
  const selected = await fixture(t);
  const alias = path.join(selected.directory, 'checkout alias');
  await fs.symlink(selected.checkout, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const aliasedScript = path.join(alias, 'tools/cli/classrup.mjs');
  const result = run(aliasedScript, ['--version', '--json'], selected.cwd);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, `${JSON.stringify(success(declaredVersion))}\n`);
  const importer = path.join(selected.cwd, 'import-only.mjs');
  await fs.writeFile(importer, `await import(${JSON.stringify(pathToFileURL(aliasedScript).href)});\n`);
  const imported = run(importer, ['--version'], selected.cwd);
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, '');
  assert.equal(imported.stderr, '');
});

test('version accepts only its bounded grammar and never echoes unchecked arguments', async t => {
  const selected = await fixture(t);
  // Invalid grammar is rejected before any metadata read.
  await fs.rm(path.join(selected.checkout, 'package.json'));
  for (const args of [
    ['--version', canary], ['--version', '--json', canary],
    ['--version', '--json', '--json'], ['--version', '--version'],
    ['--version', '--json=true'], ['--version', '--json', 'x'.repeat(8192)],
    ['--version', '--json', ...Array(64).fill(canary)],
  ]) {
    reject(run(selected.script, args, selected.cwd), 'USAGE', 2, args.includes('--json'), usage);
  }
});

test('missing and invalid checkout metadata produce fixed version errors', async t => {
  const selected = await fixture(t);
  const manifest = path.join(selected.checkout, 'package.json');
  for (const value of [
    undefined, `{ "${canary}": broken`, JSON.stringify({ name: 'classrup' }),
    JSON.stringify({ name: 'classrup', version: 123 }),
    JSON.stringify({ name: canary, version: declaredVersion }),
    JSON.stringify({ name: 'classrup', version: canary }),
    JSON.stringify({ name: 'classrup', version: `1.0.0-${'x'.repeat(65)}` }),
    JSON.stringify({ name: 'classrup', version: declaredVersion, padding: 'x'.repeat(64 * 1024) }),
  ]) {
    if (value === undefined) await fs.rm(manifest); else await fs.writeFile(manifest, value);
    for (const json of [false, true]) {
      reject(run(selected.script, ['--version', ...(json ? ['--json'] : [])], selected.cwd),
        'INFRASTRUCTURE_FAILURE', 3, json, unavailable);
    }
  }
  await fs.rm(manifest);
  await fs.mkdir(manifest);
  reject(run(selected.script, ['--version', '--json'], selected.cwd),
    'INFRASTRUCTURE_FAILURE', 3, true, unavailable);
});

test('help documents version and preserves its precedence without metadata', async t => {
  const selected = await fixture(t);
  await fs.rm(path.join(selected.checkout, 'package.json'));
  for (const args of [
    ['--help'], ['--version', '--help'], ['--version', '--json', '--help'],
    ['--version', canary, '--help'], ['record', 'verify', '--help'], ['unknown', '--help'],
  ]) {
    const result = run(selected.script, args, selected.cwd);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /node tools\/cli\/classrup\.mjs --version \[--json\]/);
    assert.match(result.stdout, /record verify --file FILE \[--json\]/);
    assert.ok(!result.stdout.includes('private-version-fixture'));
  }
});

test('version performs no network, child process, key or persistent-write operations', async t => {
  const selected = await fixture(t);
  const guard = path.join(selected.directory, 'deny-side-effects.mjs');
  await fs.writeFile(guard, `import { Socket, Server } from 'node:net';
import { promises as fs, constants } from 'node:fs';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
let attempted = false;
const deny = () => { attempted = true; throw new Error('Side effect forbidden'); };
process.on('exit', () => { if (attempted) process.exitCode = 99; });
Socket.prototype.connect = deny;
Server.prototype.listen = deny;
globalThis.fetch = deny;
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) childProcess[name] = deny;
syncBuiltinESMExports();
for (const name of ['writeFile', 'appendFile', 'mkdir', 'rename', 'unlink', 'rm', 'symlink', 'link', 'copyFile', 'truncate']) fs[name] = deny;
const open = fs.open;
fs.open = (file, flags, ...rest) => {
  if (flags !== 'r' && (typeof flags !== 'number' || (flags & (constants.O_WRONLY | constants.O_RDWR | constants.O_CREAT | constants.O_TRUNC)))) deny();
  return open(file, flags, ...rest);
};
for (const name of ['generateKey', 'sign', 'exportKey', 'importKey', 'deriveKey', 'deriveBits', 'encrypt', 'decrypt']) crypto.subtle[name] = deny;
crypto.getRandomValues = deny;
crypto.randomUUID = deny;
`);
  const before = await fs.readdir(selected.directory, { recursive: true });
  const manifestBefore = await fs.readFile(path.join(selected.checkout, 'package.json'));
  for (const json of [false, true]) {
    const result = run(selected.script, ['--version', ...(json ? ['--json'] : [])], selected.cwd,
      ['--import', pathToFileURL(guard).href]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, json ? `${JSON.stringify(success(declaredVersion))}\n`
      : `ClassRup ${declaredVersion} (unreleased checkout)\n`);
  }
  assert.deepEqual(await fs.readdir(selected.directory, { recursive: true }), before);
  assert.deepEqual(await fs.readFile(path.join(selected.checkout, 'package.json')), manifestBefore);
});

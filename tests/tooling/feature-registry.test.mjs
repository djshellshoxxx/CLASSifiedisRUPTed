import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import YAML from 'yaml';
import { createRepositoryIo } from '../../packages/platform/scripts/gen-registry.mjs';
import { generateRegistry, runGeneration, REGISTRY_OUTPUT_PATH } from '../../packages/platform/src/configuration/feature/generate.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const generator = join(ROOT, 'packages/platform/scripts/gen-registry.mjs');
const specPath = '01_Bazaar/01_listings/mod_listing/module.spec.yaml';

// Local runners without symlink rights may skip; CI must never silently skip.
function skipOrFailInCi(t, reason) {
  if (process.env.CI) {
    throw new Error(`Symlink test "${t.name}" cannot run on this CI runner (${reason}). Skipping is forbidden when CI is set; provide a runner that can create symbolic links.`);
  }
  t.diagnostic(`SKIPPED locally: "${t.name}" needs symbolic links (${reason}). It is enforced in CI.`);
  t.skip(reason);
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'classrup-registry-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const catalog = '# ---- F01 Bazaar (slug bazaar) ----\n' + YAML.stringify({ modules: [
    { id: 'F01.S01.M01', title: 'Listings', code: 'packages/bazaar/src/listings', path: dirname(specPath).replaceAll('\\', '/') },
  ] });
  write('planning/modules.yaml', catalog);
  write(specPath, 'id: F01.S01.M01\nscope: MVP\ndepends_on: []\n');
  write(REGISTRY_OUTPUT_PATH, 'previous output\n');
  return { root, write, io: createRepositoryIo(root) };
}

test('real catalog generates the checked-in immutable graph within the raw and gzip size budgets', async () => {
  const io = createRepositoryIo(ROOT);
  const first = await generateRegistry(io, { strict: true });
  const second = await generateRegistry(io, { strict: true });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value.text, second.value.text);
  assert.equal(first.value.text, io.readText(REGISTRY_OUTPUT_PATH));
  assert.equal(first.value.summary.features, 18);
  assert.equal(first.value.summary.modules, 148);
  assert.equal(first.value.summary.specsMissing, 0);
  assert.equal(new Set(first.value.registry.order).size, 148);
  assert.ok(first.value.summary.bytes < 512 * 1024);
  assert.ok(gzipSync(JSON.stringify(first.value.registry)).length < 64 * 1024);
  for (const module of first.value.registry.modules) {
    assert.equal(module.defaultState, module.scope === 'MVP' ? 'on' : 'off');
    assert.equal(module.registered, module.scope === 'MVP');
    for (const dependency of module.dependsOn) {
      assert.ok(first.value.registry.order.indexOf(dependency) < first.value.registry.order.indexOf(module.id));
    }
  }
});

test('stale checks never write; a valid source change requires explicit regeneration', async (t) => {
  const { io, write } = fixture(t);
  assert.equal((await runGeneration(io, { strict: true })).ok, true);
  const prior = io.readText(REGISTRY_OUTPUT_PATH);
  assert.equal((await runGeneration(io, { strict: true, check: true })).ok, true);
  write(specPath, 'id: F01.S01.M01\nscope: MVP\ndepends_on: [CTR-FLG-001]\n');
  const stale = await runGeneration(io, { strict: true, check: true });
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, 'PLATFORM_FEATURE_REGISTRY_STALE');
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), prior);
  assert.equal((await runGeneration(io, { strict: true })).ok, true);
  assert.notEqual(io.readText(REGISTRY_OUTPUT_PATH), prior);
});

test('parse and graph failures preserve the previous generated output', async (t) => {
  const { io, write } = fixture(t);
  for (const invalid of ['[', 'id: F01.S01.M01\nscope: MVP\ndepends_on: [F99.S01.M01]\n', 'id: F01.S01.M01\nscope: FUTURE\ndepends_on: [F01.S01.M01]\n']) {
    write(specPath, invalid);
    const result = await runGeneration(io, { strict: true });
    assert.equal(result.ok, false);
    assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
  }
  write('planning/modules.yaml', 'modules: [');
  assert.equal((await runGeneration(io, { strict: true })).ok, false);
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
});

test('a catalog entry cannot use a different module specification or a null dependency list', async (t) => {
  const { io, write } = fixture(t);
  for (const id of ['F02.S01.M01', null]) {
    write(specPath, YAML.stringify({ id, scope: 'MVP', depends_on: [] }));
    const result = await runGeneration(io, { strict: true });
    assert.equal(result.ok, false);
    assert.equal(result.error.fields[0].code, 'SPEC_ID_MISMATCH');
    assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
  }
  write(specPath, 'id: F01.S01.M01\nscope: MVP\ndepends_on: null\n');
  assert.equal((await runGeneration(io, { strict: true })).ok, false);
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
});

test('catalog path traversal is rejected before calling the injected spec reader', async () => {
  for (const path of ['../outside', '/outside', 'C:/outside', 'C:\\outside', 'nested/../outside', 'nested//outside', './outside', 'nested\u0000path']) {
    const reads = [];
    const result = await generateRegistry({
      readText(file) {
        reads.push(file);
        return '# ---- F01 Bazaar (slug bazaar) ----\n' + YAML.stringify({ modules: [
          { id: 'F01.S01.M01', title: 'Listings', code: 'packages/bazaar/src/listings', path },
        ] });
      },
      parseYaml: (text) => YAML.parse(text),
    });
    assert.equal(result.ok, false, path);
    assert.equal(result.error.fields[0].code, 'INVALID_SPEC_PATH', path);
    assert.deepEqual(reads, ['planning/modules.yaml'], path);
  }
});

test('the filesystem adapter rejects traversal for reads and writes', (t) => {
  const { io } = fixture(t);
  for (const path of ['../outside', '/outside', 'C:/outside', 'C:\\outside', './outside', 'nested/../outside']) {
    assert.throws(() => io.readText(path), /Invalid repository path/);
    assert.throws(() => io.writeAtomic(path, 'changed'), /Invalid repository path/);
  }
});

test('spec and output symlinks cannot read or replace an external file', async (t) => {
  const { root, io } = fixture(t);
  const external = mkdtempSync(join(tmpdir(), 'classrup-registry-external-'));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  const secret = join(external, 'input.yaml');
  writeFileSync(secret, 'scope: MVP\ndepends_on: []\n');
  rmSync(join(root, specPath));
  try { symlinkSync(secret, join(root, specPath), 'file'); }
  catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') { skipOrFailInCi(t, 'Host cannot create symlinks'); return; }
    throw error;
  }
  assert.throws(() => io.readText(specPath), /Symbolic links/);
  const result = await runGeneration(io, { strict: true });
  assert.equal(result.ok, false);
  assert.equal(result.error.fields[0].code, 'READ_FAILED');
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
  rmSync(join(root, REGISTRY_OUTPUT_PATH));
  symlinkSync(secret, join(root, REGISTRY_OUTPUT_PATH), 'file');
  assert.throws(() => io.writeAtomic(REGISTRY_OUTPUT_PATH, 'changed'), /Symbolic links/);
  assert.equal(readFileSync(secret, 'utf8'), 'scope: MVP\ndepends_on: []\n');
});

test('a symbolic-link directory cannot redirect the registry reader', (t) => {
  const { root, io } = fixture(t);
  const external = mkdtempSync(join(tmpdir(), 'classrup-registry-linked-dir-'));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  writeFileSync(join(external, 'module.spec.yaml'), 'outside');
  try { symlinkSync(external, join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') { skipOrFailInCi(t, 'Host cannot create symlinks'); return; }
    throw error;
  }
  assert.throws(() => io.readText('linked/module.spec.yaml'), /Symbolic links/);
});

test('an interrupted temporary file survives a failed replacement and the prior output stays intact', async (t) => {
  const { root, io } = fixture(t);
  const temp = join(root, `${REGISTRY_OUTPUT_PATH}.${process.pid}.tmp`);
  writeFileSync(temp, 'other unfinished writer');
  const failed = await runGeneration(io, { strict: true });
  assert.equal(failed.ok, false);
  assert.equal(failed.error.code, 'INTERNAL');
  assert.equal(readFileSync(temp, 'utf8'), 'other unfinished writer');
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), 'previous output\n');
  rmSync(temp);
  assert.equal((await runGeneration(io, { strict: true })).ok, true);
  const first = io.readText(REGISTRY_OUTPUT_PATH);
  assert.equal((await runGeneration(io, { strict: true })).ok, true);
  assert.equal(io.readText(REGISTRY_OUTPUT_PATH), first);
});

test('a partial write failure cleans up its own temporary file and permits retry', (t) => {
  const { root } = fixture(t);
  const script = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { join } from 'node:path';
    const { createRepositoryIo } = await import(${JSON.stringify(pathToFileURL(generator).href)});
    const root = ${JSON.stringify(root)};
    const output = ${JSON.stringify(REGISTRY_OUTPUT_PATH)};
    const original = fs.writeFileSync;
    const io = createRepositoryIo(root);
    fs.writeFileSync = (file, ...args) => {
      original(file, 'partial');
      throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    };
    syncBuiltinESMExports();
    let failure;
    try { io.writeAtomic(output, 'new output'); } catch (error) { failure = error.code; }
    finally { fs.writeFileSync = original; syncBuiltinESMExports(); }
    const prior = fs.readFileSync(join(root, output), 'utf8');
    const partialLeft = fs.existsSync(join(root, output + '.' + process.pid + '.tmp'));
    io.writeAtomic(output, 'retried output');
    console.log(JSON.stringify({ failure, prior, partialLeft, after: fs.readFileSync(join(root, output), 'utf8') }));
  `;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' }));
  assert.deepEqual(result, { failure: 'ENOSPC', prior: 'previous output\n', partialLeft: false, after: 'retried output' });
});

test('read errors and invalid output paths return structured failures without writing', async () => {
  let writes = 0;
  const io = { readText() { throw new Error('unavailable'); }, parseYaml: YAML.parse, writeAtomic() { writes += 1; } };
  const read = await runGeneration(io);
  assert.equal(read.ok, false);
  assert.equal(read.error.fields[0].code, 'READ_FAILED');
  const output = await runGeneration(io, { out: '../outside' });
  assert.equal(output.ok, false);
  assert.equal(output.error.fields[0].code, 'INVALID_OUTPUT_PATH');
  assert.equal(writes, 0);
});

test('generator CLI rejects unknown arguments and the documented build retains the stale gate', () => {
  const result = spawnSync(process.execPath, [generator, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
  const output = execFileSync(process.execPath, [generator, '--check', '--strict'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(output, /18 features, 148 modules/);
  assert.match(output, /up to date/);
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.build, /gen-registry\.mjs --check --strict &&/);
  const workflow = YAML.parse(readFileSync(join(ROOT, '.github/workflows/alpha-checks.yml'), 'utf8'));
  assert.ok(workflow.jobs.domain.steps.some((step) => step.run === 'corepack pnpm registry:check'));
});

test('Git preserves exact registry input and output line endings on Windows checkouts', () => {
  const paths = ['planning/modules.yaml', '15_Platform/04_configuration/mod_feature/module.spec.yaml', REGISTRY_OUTPUT_PATH];
  const output = execFileSync('git', ['-c', 'core.autocrlf=true', 'check-attr', 'eol', '--', ...paths], { cwd: ROOT, encoding: 'utf8' });
  assert.deepEqual(output.trim().split(/\r?\n/), paths.map(path => `${path}: eol: lf`));
});

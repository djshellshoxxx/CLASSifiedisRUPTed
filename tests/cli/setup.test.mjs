import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'node:net';
import { spawnSync } from 'node:child_process';
import { DEFAULTS, ROOT, assertRuntime, assertPackageManager, parseOptions, validateConfig, setup, configure, build, readConfig, checkPort, serve } from '../../tools/cli/classrup.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup setup with spaces '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
async function freePort() {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}
test('runtime and package manager compatibility fail closed', () => {
  for (const version of ['20.20.0', '22.17.9', 'invalid']) assert.throws(() => assertRuntime(version), /unsupported/);
  for (const version of ['22.18.0', '24.22.1']) assert.doesNotThrow(() => assertRuntime(version));
  assert.throws(() => assertPackageManager('pnpm/11.25.0 npm/?'), /pinned/);
  assert.throws(() => assertPackageManager('npm/10.28.0'), /pinned/);
  assert.doesNotThrow(() => assertPackageManager('pnpm/10.28.0 npm/? node/v22.18.0'));
});
test('setup accepts validated explicit flags only', () => {
  assert.deepEqual(parseOptions(['--non-interactive', '--host', '0.0.0.0', '--port', '9000', '--base', '/alpha/']), { host: '0.0.0.0', port: 9000, base: '/alpha/' });
  for (const args of [['--port'], ['--port', '1e3'], ['--host', 'x', '--host', 'y'], ['--secret', 'x']]) assert.throws(() => parseOptions(args));
  for (const changes of [{ port: 0 }, { port: 65536 }, { port: 1.5 }, { host: 'evil.test' }, { base: '/../' }, { base: '//evil/' }, { schemaVersion: 2 }, { token: 'secret' }]) assert.throws(() => validateConfig({ ...DEFAULTS, ...changes }));
});
test('setup preserves config byte-for-byte and unrelated data on repeat', async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, 'sentinel'), 'user data');
  assert.equal((await setup(root, { port: 9001 })).created, true);
  const target = path.join(root, '.classrup/local.json');
  const before = await fs.readFile(target, 'utf8');
  assert.equal((await setup(root)).created, false);
  assert.equal(await fs.readFile(target, 'utf8'), before);
  assert.equal(await fs.readFile(path.join(root, 'sentinel'), 'utf8'), 'user data');
  await assert.rejects(setup(root, { port: 9002 }), /preserves/);
  assert.equal(await fs.readFile(target, 'utf8'), before);
});
test('concurrent setups and interrupted temporary files never corrupt config', async t => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, '.classrup'));
  await fs.writeFile(path.join(root, '.classrup/.setup-interrupted.tmp'), '{');
  const results = await Promise.all(Array.from({ length: 8 }, () => setup(root)));
  assert.equal(results.filter(r => r.created).length, 1);
  assert.deepEqual(await readConfig(root), DEFAULTS);
  assert.equal(await fs.readFile(path.join(root, '.classrup/.setup-interrupted.tmp'), 'utf8'), '{');
  assert.deepEqual((await fs.readdir(path.join(root, '.classrup'))).sort(), ['.setup-interrupted.tmp', 'local.json']);
});
test('invalid existing config is preserved and missing config is actionable', async t => {
  const root = await fixture(t);
  await assert.rejects(readConfig(root), /Run pnpm run setup/);
  await setup(root);
  const target = path.join(root, '.classrup/local.json');
  await fs.writeFile(target, '{broken');
  await assert.rejects(setup(root), /Invalid/);
  assert.equal(await fs.readFile(target, 'utf8'), '{broken');
});
test('setup fails clearly when config path is not a directory', async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, '.classrup'), 'preserve');
  await assert.rejects(setup(root));
  assert.equal(await fs.readFile(path.join(root, '.classrup'), 'utf8'), 'preserve');
});
test('occupied port is a blocking diagnostic', async t => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => probe.close(resolve)));
  await assert.rejects(checkPort({ host: '127.0.0.1', port: probe.address().port }), /Stop the conflicting service/);
});
test('preview serves only public output with security headers, correct base and methods', async t => {
  const root = await fixture(t);
  await setup(root, { port: await freePort(), base: '/alpha/' });
  await fs.mkdir(path.join(root, 'dist'));
  await fs.writeFile(path.join(root, 'dist/index.html'), '<title>real source placeholder for server unit test</title>');
  await fs.writeFile(path.join(root, 'secret.txt'), 'private');
  await fs.writeFile(path.join(root, 'dist/.hidden'), 'private');
  const { server, config } = await serve(root);
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${config.port}`;
  const response = await fetch(`${base}/alpha/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const url of ['/alpha/%2e%2e%2fsecret.txt', '/alpha/.hidden', '/alpha/%5csecret.txt', '/other/']) assert.equal((await fetch(base + url)).status, 404, url);
  assert.equal((await fetch(base + '/alpha/%QQ')).status, 400);
  assert.equal((await fetch(base + '/alpha/', { method: 'POST' })).status, 405);
  assert.equal(await (await fetch(base + '/alpha/', { method: 'HEAD' })).text(), '');
});
test('CLI failures exit nonzero and help is available without setup', () => {
  const script = path.join(ROOT, 'tools/cli/classrup.mjs');
  const env = { ...process.env, npm_config_user_agent: 'pnpm/10.28.0' };
  assert.equal(spawnSync(process.execPath, [script, '--help'], { env }).status, 0);
  assert.equal(spawnSync(process.execPath, [script, 'not-a-command'], { env }).status, 1);
  assert.equal(spawnSync(process.execPath, [script, 'setup', '--port', 'bad'], { env }).status, 1);
});

test('explicit configure changes only validated fields and preserves on failure', async t => {
  const root = await fixture(t);
  await setup(root);
  await configure(root, { port: 9002, base: '/classrup/' });
  assert.deepEqual(await readConfig(root), { ...DEFAULTS, port: 9002, base: '/classrup/' });
  const before = await fs.readFile(path.join(root, '.classrup/local.json'), 'utf8');
  await assert.rejects(configure(root, { port: -1 }));
  assert.equal(await fs.readFile(path.join(root, '.classrup/local.json'), 'utf8'), before);
  await fs.writeFile(path.join(root, '.classrup/.configure.lock'), 'interrupted');
  await assert.rejects(configure(root, { port: 9003 }), /already in progress/);
  assert.equal(await fs.readFile(path.join(root, '.classrup/local.json'), 'utf8'), before);
});
test('build failure preserves prior output and successful build removes stale assets', async t => {
  const root = await fixture(t);
  await setup(root);
  await fs.mkdir(path.join(root, 'apps/pwa/src'), { recursive: true });
  await fs.mkdir(path.join(root, 'dist'));
  await fs.writeFile(path.join(root, 'dist/index.html'), 'previous');
  await fs.writeFile(path.join(root, 'dist/obsolete.js'), 'stale');
  await assert.rejects(build(root));
  assert.equal(await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'), 'previous');
  await fs.writeFile(path.join(root, 'apps/pwa/index.html'), '<h1>Build fixture</h1><script src="./app.js" type="module"></script>');
  await fs.writeFile(path.join(root, 'apps/pwa/src/main.ts'), 'document.body.dataset.ready = "yes";');
  await build(root);
  assert.match(await fs.readFile(path.join(root, 'dist/app.js'), 'utf8'), /ready/);
  await assert.rejects(fs.access(path.join(root, 'dist/obsolete.js')));
  await fs.writeFile(path.join(root, 'apps/pwa/src/main.ts'), 'this is invalid typescript !');
  await assert.rejects(build(root));
  assert.match(await fs.readFile(path.join(root, 'dist/app.js'), 'utf8'), /ready/);
});

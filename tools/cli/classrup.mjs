#!/usr/bin/env node
import { promises as fs, constants } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createProbe } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

export const DEFAULTS = Object.freeze({ schemaVersion: 1, host: '127.0.0.1', port: 4173, base: '/' });
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG = '.classrup/local.json';
const HELP = `ClassRup local PWA tools
Usage: pnpm run setup [--host HOST] [--port PORT] [--base /path/] [--non-interactive]
       pnpm run configure [--host HOST] [--port PORT] [--base /path/]
       pnpm run doctor | pnpm dev | pnpm build | pnpm preview
       node tools/cli/classrup.mjs COMMAND --help
Setup preserves existing configuration. Defaults: localhost, port 4173, base /.
LAN binding requires explicit --host; HTTP on LAN is not a secure browser context.
No relay, server account, secret or browser key is created. Dependencies must be
installed explicitly: corepack pnpm install --frozen-lockfile.
Note: 'pnpm setup' and 'pnpm doctor' are pnpm built-ins; use 'pnpm run setup' and 'pnpm run doctor'.`;

export function assertRuntime(version = process.versions.node) {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!parts || +parts[1] < 22 || (+parts[1] === 22 && +parts[2] < 18)) {
    throw new Error(`Node ${version} is unsupported. Install Node >=22.18.0.`);
  }
}
export function assertPackageManager(agent = process.env.npm_config_user_agent) {
  if (agent && !/^pnpm\/10\.28\.0(?:\s|$)/.test(agent)) {
    throw new Error('Use pinned pnpm 10.28.0: corepack pnpm <command>.');
  }
}
export function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--non-interactive') continue;
    if (!['--host', '--port', '--base'].includes(key) || !args[i + 1]) throw new Error(`Unknown or incomplete option: ${key}`);
    if (Object.hasOwn(options, key.slice(2))) throw new Error(`Duplicate option: ${key}`);
    const value = args[++i];
    if (key === '--port' && !/^\d+$/.test(value)) throw new Error('Port must be an integer from 1 to 65535.');
    options[key.slice(2)] = key === '--port' ? Number(value) : value;
  }
  return options;
}
export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config) || Object.keys(config).sort().join(',') !== 'base,host,port,schemaVersion') throw new Error('Invalid configuration keys. Expected schemaVersion, host, port, base.');
  if (config.schemaVersion !== 1) throw new Error('Unsupported configuration version.');
  if (!['localhost', '127.0.0.1', '::1', '0.0.0.0', '::'].includes(config.host)) throw new Error('Host must be localhost, 127.0.0.1, ::1, 0.0.0.0 or ::.');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('Port must be an integer from 1 to 65535.');
  if (typeof config.base !== 'string' || !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(config.base)) throw new Error('Base must be / or slash-delimited path segments, e.g. /classrup/.');
  return config;
}
export async function readConfig(root = ROOT) {
  const target = path.join(root, CONFIG);
  let content;
  try {
    if (!(await fs.lstat(path.dirname(target))).isDirectory()) throw new Error('Configuration directory must be a real directory.');
    const stat = await fs.lstat(target);
    if (!stat.isFile() || stat.size > 4096) throw new Error('Configuration must be a regular file smaller than 4 KB.');
    content = await fs.readFile(target, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Missing local configuration. Run pnpm run setup.');
    throw error;
  }
  let parsed;
  try { parsed = JSON.parse(content); }
  catch { throw new Error(`Invalid ${CONFIG}: malformed JSON (contents omitted).`); }
  try { return validateConfig(parsed); }
  catch (error) { throw new Error(`Invalid ${CONFIG}: ${error.message}`); }
}
export async function setup(root = ROOT, options = {}) {
  const desired = validateConfig({ ...DEFAULTS, ...options });
  const directory = path.join(root, '.classrup');
  await fs.mkdir(directory, { recursive: true });
  if (!(await fs.lstat(directory)).isDirectory()) throw new Error('Configuration directory must not be a symlink.');
  const target = path.join(root, CONFIG);
  try {
    await fs.lstat(target);
    const current = await readConfig(root);
    for (const key of Object.keys(options)) {
      if (current[key] !== desired[key]) throw new Error(`Existing ${key} differs; setup preserves configuration. Use pnpm run configure with explicit options to change it.`);
    }
    return { created: false, config: current };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  // A complete temporary file is linked atomically; concurrent setup cannot overwrite.
  const temporary = path.join(directory, `.setup-${randomUUID()}.tmp`);
  try {
    const handle = await fs.open(temporary, 'wx', 0o600);
    try { await handle.writeFile(`${JSON.stringify(desired, null, 2)}\n`); await handle.sync(); }
    finally { await handle.close(); }
    try { await fs.link(temporary, target); }
    catch (error) { if (error.code !== 'EEXIST') throw error; return setup(root, options); }
  } finally { await fs.rm(temporary, { force: true }); }
  return { created: true, config: desired };
}
export async function configure(root = ROOT, options = {}) {
  const directory = path.join(root, '.classrup');
  if (!(await fs.lstat(directory)).isDirectory()) throw new Error('Configuration directory must not be a symlink.');
  const lock = path.join(directory, '.configure.lock');
  const handle = await fs.open(lock, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Configuration update is already in progress. If an earlier process was interrupted, remove .classrup/.configure.lock and retry.');
    throw error;
  });
  const temporary = path.join(directory, `.configure-${randomUUID()}.tmp`);
  try {
    const config = validateConfig({ ...await readConfig(root), ...options });
    const writer = await fs.open(temporary, 'wx', 0o600);
    try { await writer.writeFile(`${JSON.stringify(config, null, 2)}\n`); await writer.sync(); }
    finally { await writer.close(); }
    await fs.rename(temporary, path.join(root, CONFIG));
    return config;
  } finally {
    await handle.close();
    await fs.rm(temporary, { force: true });
    await fs.rm(lock, { force: true });
  }
}
export async function checkPort({ host, port }) {
  const server = createProbe();
  await new Promise((resolve, reject) => {
    server.once('error', error => reject(new Error(`Cannot bind ${host}:${port}: ${error.code}. Stop the conflicting service or explicitly change .classrup/local.json.`)));
    server.listen({ host, port, exclusive: true }, resolve);
  });
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
export async function doctor(root = ROOT) {
  assertRuntime(); assertPackageManager();
  const config = await readConfig(root);
  await fs.access(path.join(root, '.classrup'), constants.W_OK);
  await fs.access(root, constants.W_OK);
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  if (manifest.packageManager !== 'pnpm@10.28.0') throw new Error('Workspace must pin pnpm@10.28.0.');
  await fs.access(path.join(root, 'pnpm-lock.yaml')).catch(() => { throw new Error('Missing pnpm-lock.yaml. Restore the reviewed lockfile before installing.'); });
  const packageRoots = [root];
  for (const folder of ['packages', 'apps']) {
    const entries = await fs.readdir(path.join(root, folder), { withFileTypes: true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    packageRoots.push(...entries.filter(entry => entry.isDirectory()).map(entry => path.join(root, folder, entry.name)));
  }
  for (const packageRoot of packageRoots) {
    let local;
    try { local = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const [name, expected] of Object.entries({ ...local.dependencies, ...local.devDependencies })) {
      let installed;
      try { installed = JSON.parse(await fs.readFile(path.join(packageRoot, 'node_modules', name, 'package.json'), 'utf8')); }
      catch { throw new Error(`Missing dependency ${name} for ${local.name}. Run corepack pnpm install --frozen-lockfile.`); }
      if (/^\d+\.\d+\.\d+$/.test(expected) && installed.version !== expected) throw new Error(`Dependency ${name} has version ${installed.version}; expected ${expected}. Reinstall with the frozen lockfile.`);
    }
  }
  await fs.access(path.join(root, 'apps/pwa/src/main.ts')).catch(() => { throw new Error('Integrated PWA source is missing: apps/pwa/src/main.ts.'); });
  await checkPort(config);
  return config;
}
export async function build(root = ROOT) {
  const config = await readConfig(root);
  const { build: bundle } = await import('esbuild');
  const source = path.join(root, 'apps/pwa');
  const output = path.join(root, 'dist');
  const staging = path.join(root, `.classrup/build-${randomUUID()}`);
  await fs.mkdir(staging, { recursive: true });
  try {
    const html = await fs.readFile(path.join(source, 'index.html'), 'utf8');
    await bundle({ entryPoints: [path.join(source, 'src/main.ts')], outfile: path.join(staging, 'app.js'), bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true, sourcemap: false, write: true });
    await fs.cp(path.join(source, 'public'), staging, { recursive: true }).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await fs.writeFile(path.join(staging, 'index.html'), html);
    const workerPath = path.join(staging, 'sw.js');
    let worker;
    try { worker = await fs.readFile(workerPath, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (worker !== undefined) {
      const hash = createHash('sha256');
      hash.update(worker);
      for (const asset of ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'icon.svg']) {
        hash.update(asset); hash.update(await fs.readFile(path.join(staging, asset)));
      }
      await fs.writeFile(workerPath, worker.replaceAll('__BUILD_ID__', hash.digest('hex')));
    }
    // Output contains generated public assets only. Never touch browser/user vaults.
    const previous = path.join(root, `.classrup/previous-build-${randomUUID()}`);
    let hadPrevious = false;
    try {
      const stat = await fs.lstat(output);
      if (!stat.isDirectory()) throw new Error('Build output dist must be a directory, not a symlink or file.');
      await fs.rename(output, previous);
      hadPrevious = true;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await fs.rename(staging, output); }
    catch (error) { if (hadPrevious) await fs.rename(previous, output); throw error; }
    if (hadPrevious) await fs.rm(previous, { recursive: true, force: true });
  } finally { await fs.rm(staging, { recursive: true, force: true }); }
  return { output, config };
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
export async function serve(root = ROOT) {
  const config = await readConfig(root);
  const output = await fs.realpath(path.join(root, 'dist')).catch(() => { throw new Error('No production build. Run pnpm build.'); });
  await fs.access(path.join(output, 'index.html'));
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    try {
      const raw = (req.url ?? '/').split('?')[0];
      const pathname = decodeURIComponent(raw);
      if (!pathname.startsWith(config.base) || pathname.includes('\\') || pathname.includes('\0')) { res.writeHead(404); res.end(); return; }
      const relative = pathname.slice(config.base.length) || 'index.html';
      if (relative.split('/').some(segment => segment === '..' || segment.startsWith('.'))) { res.writeHead(404); res.end(); return; }
      const file = await fs.realpath(path.join(output, relative));
      if (!file.startsWith(output + path.sep) || !(await fs.stat(file)).isFile()) { res.writeHead(404); res.end(); return; }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { res.writeHead(error instanceof URIError ? 400 : 404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen({ host: config.host, port: config.port, exclusive: true }, resolve); });
  return { server, config };
}
export async function main(args = process.argv.slice(2)) {
  const [command, ...rest] = args;
  if (rest.includes('--help') || command === '--help') { console.log(HELP); return; }
  assertRuntime(); assertPackageManager();
  if (command === 'configure') {
    await configure(ROOT, parseOptions(rest));
    console.log('Updated non-secret local configuration. Browser vault data is untouched. Run pnpm run doctor.');
  } else if (command === 'setup') {
    const result = await setup(ROOT, parseOptions(rest));
    console.log(`${result.created ? 'Created' : 'Preserved'} ${CONFIG}. Browser vault data is untouched.`);
  } else {
    if (rest.length) throw new Error('Options are supported only by setup and configure. Use --help.');
    if (command === 'doctor') { await doctor(); console.log('Local prerequisites ready. Relay: optional; no relay required or configured.'); }
    else if (command === 'build') { await build(); console.log('Built dist/. Publish these public assets over HTTPS.'); }
    else if (command === 'dev' || command === 'preview') {
      if (command === 'dev') await build();
      const { server, config } = await serve();
      const displayHost = config.host.includes(':') ? `[${config.host}]` : config.host;
      console.log(`ClassRup: http://${displayHost}:${config.port}${config.base}`);
      console.log('Local development/preview server; not hardened production hosting.');
      if (['0.0.0.0', '::'].includes(config.host)) console.log('Explicit LAN binding enabled. Use HTTPS for browser cryptography outside localhost.');
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(); server.closeAllConnections(); });
    } else throw new Error(HELP);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`ClassRup: ${error.message}`); process.exitCode = 1; });
}

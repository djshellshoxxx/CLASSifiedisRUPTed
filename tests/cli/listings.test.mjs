import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../../tools/cli/classrup.mjs';
import { LISTING_LIMITS, runPublicListingCommand } from '../../tools/cli/listings.mjs';
import { didFromPublicKey } from '../../packages/security/src/index.ts';
import { verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions } from '../../packages/discovery/src/index.ts';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';

const KEY = createPrivateKey({ format: 'der', type: 'pkcs8', key: Buffer.from('302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex') });
const OTHER_KEY = createPrivateKey({ format: 'der', type: 'pkcs8', key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.alloc(32, 3)]) });
const owner = key => didFromPublicKey(createPublicKey(key).export({ format: 'der', type: 'spki' }).subarray(-32));
const author = owner(KEY);
const otherAuthor = owner(OTHER_KEY);
const now = Date.now();
const id = n => `019a87d0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const listingId = id(1);
const categoryId = id(900);
const secret = 'PRIVATE_EXTENSION_OR_PATH_MUST_NOT_APPEAR';
const script = path.join(ROOT, 'tools/cli/classrup.mjs');
const env = { ...process.env, npm_config_user_agent: 'pnpm/10.28.0' };

// Independent fixture encoder and Node signing API, not the production envelope signer.
function encode(value) {
  const keys = new Set();
  function visit(item) {
    if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) { keys.add(key); visit(child); }
  }
  visit(value);
  return JSON.stringify(value, [...keys].sort());
}
function projection(changes = {}) {
  return { listingId, ownerId: author, revision: 1, kind: 'sell', title: 'Winter bicycle',
    description: 'A reliable winter bicycle.', categoryId, condition: 'good', tags: ['bike'], locale: 'en',
    regionCell: 'c2b2', barterOptIn: true, availability: 'available', value: { currency: 'CAD', amount: '2500' },
    expiresAt: new Date(now + 86400000).toISOString(), ...changes };
}
function signed(payload = projection(), changes = {}, key = KEY) {
  const content = { v: 1, type: 'classrup.bazaar.listing/v1', author: owner(key),
    createdAt: new Date(now - 120000).toISOString(), seq: 1, prev: null, payload, ext: { private: secret }, ...changes };
  const cid = `sha256-${createHash('sha256').update(encode(content)).digest('hex')}`;
  const unsigned = { ...content, cid };
  return { ...unsigned, sig: sign(null, Buffer.from(encode(unsigned)), key).toString('base64url') };
}
function withdrawal(previous, changes = {}, key = KEY) {
  return signed({ listingId: previous.payload.listingId, ownerId: owner(key), revision: previous.payload.revision + 1,
    target: previous.cid, reason: 'owner', ...changes },
  { type: 'classrup.alpha.tombstone/v1', seq: previous.seq + 1, prev: previous.cid }, key);
}
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup listing files with spaces '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
async function file(root, value, name = 'selected listing.json') {
  const selected = path.join(root, name);
  await fs.writeFile(selected, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
  return selected;
}
const inputs = files => files.flatMap(file => ['--file', file]);
function run(args, cwd, nodeOptions = []) {
  return spawnSync(process.execPath, [...nodeOptions, script, ...args], { cwd, env, encoding: 'utf8', timeout: 20000 });
}
function success(result) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.ok, true);
  assert.ok(!result.stdout.includes(secret));
  return output;
}
function rejected(result, code, status = 2) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, status, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.ok, false);
  assert.equal(output.error.code, code);
  assert.ok(!result.stdout.includes(secret));
  assert.deepEqual(Object.keys(output).sort(), ['command', 'error', 'ok', 'schemaVersion']);
  return output;
}

test('list uses deterministic signed public projections, ignores duplicate CIDs and makes no persistent changes', async t => {
  const root = await fixture(t);
  const first = signed();
  const second = signed(projection({ listingId: id(2), title: 'Second bicycle', value: { currency: 'BTC', amount: '123456789012345678901234567890' } }));
  const files = [await file(root, second, 'second.json'), await file(root, first, 'first.json'), await file(root, first, 'duplicate.json')];
  const before = await Promise.all(files.map(name => fs.readFile(name)));
  const result = success(run(['listing', 'list', ...inputs([...files, files[1]]), '--json'], root));
  assert.equal(result.command, 'listing.list');
  assert.equal(result.source.filesRead, 4);
  assert.equal(result.source.uniqueRecords, 2);
  assert.equal(result.source.kind, 'explicit-public-files');
  assert.deepEqual(result.items.map(item => item.listing.listingId), [listingId, id(2)]);
  assert.deepEqual(result.items[0].listing, first.payload);
  assert.equal(result.items[1].listing.value.amount, '123456789012345678901234567890');
  assert.deepEqual(result.pagination, { offset: 0, limit: 20, total: 2, nextOffset: null });
  assert.deepEqual({ ...result.verification, checkedAt: undefined }, { checkedAt: undefined,
    signature: 'valid', contentHash: 'valid', payload: 'valid', authorBinding: 'valid', expiry: 'unexpired', history: 'selected-files-only',
    chain: 'unchecked', revocation: 'unchecked', currentOwnership: 'not-established', trust: 'not-established', persistence: 'none' });
  const reversed = success(run(['listing', 'list', ...inputs([...files].reverse()), '--json'], root));
  assert.deepEqual(reversed.items, result.items);
  assert.equal(reversed.source.snapshot, result.source.snapshot);
  assert.deepEqual(await Promise.all(files.map(name => fs.readFile(name))), before);
  assert.deepEqual((await fs.readdir(root)).sort(), ['duplicate.json', 'first.json', 'second.json']);
});

test('show selects owner plus listing ID without conflating two authors and includes an unavailable publication', async t => {
  const root = await fixture(t);
  const one = signed(projection({ availability: 'unavailable' }));
  const two = signed(projection({ ownerId: otherAuthor, title: 'Other author bicycle' }), {}, OTHER_KEY);
  const files = [await file(root, one, 'one.json'), await file(root, two, 'two.json')];
  const shown = success(run(['listing', 'show', ...inputs(files), '--id', listingId, '--owner', author, '--json'], root));
  assert.equal(shown.command, 'listing.show');
  assert.deepEqual(shown.item.listing, one.payload);
  const list = success(run(['listing', 'list', ...inputs(files), '--json'], root));
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].author, otherAuthor);
  assert.equal(success(run(['listing', 'list', ...inputs(files), '--include-unavailable', '--json'], root)).items.length, 2);
  rejected(run(['listing', 'show', ...inputs(files), '--id', id(99), '--owner', author, '--json'], root), 'NOT_FOUND', 4);
});

test('search filters match the shared PWA query, including declared currency minor units and coarse regions', async t => {
  const root = await fixture(t);
  const records = [signed(), signed(projection({ listingId: id(2), title: 'Summer bicycle', regionCell: 'c2b30', value: { currency: 'USD', amount: '2500' } })),
    signed(projection({ listingId: id(3), title: 'Winter boots', barterOptIn: false, categoryId: id(901) })),
    signed(projection({ listingId: id(4), title: 'Winter spare bicycle', availability: 'unavailable' }))];
  const files = await Promise.all(records.map((record, n) => file(root, record, `${n}.json`)));
  const query = { query: 'WINTER', regionCell: 'c2b2', barterOnly: true, includeUnavailable: false,
    options: { categoryId, kind: 'sell', condition: 'good', price: { currency: 'CAD', min: '2499', max: '2500' }, sort: 'retained' } };
  const kernel = createTestKernel({ start: now, definitions: discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now }) }).all });
  for (const record of records) assert.equal((await kernel.cmd('discovery.listing.retain', { envelope: record })).ok, true);
  const expected = await kernel.ask('discovery.listing.search', query);
  assert.equal(expected.ok, true);
  const result = success(run(['search', ...inputs(files), '--query', 'WINTER', '--region', 'c2b2', '--barter-only', '--category', categoryId,
    '--kind', 'sell', '--condition', 'good', '--currency', 'CAD', '--min-price', '2499', '--max-price', '2500', '--json'], root));
  assert.equal(result.command, 'search');
  assert.deepEqual(result.items.map(item => item.listing), expected.value.value.items.map(item => item.projection));
  assert.equal(result.excludedSubjects, expected.value.value.staleOrExcluded);
  const empty = success(run(['search', ...inputs(files), '--query', 'nothing matches', '--json'], root));
  assert.deepEqual(empty.items, []);
  assert.deepEqual(empty.pagination, { offset: 0, limit: 20, total: 0, nextOffset: null });
  assert.equal(success(run(['search', ...inputs(files), '--query', '', '--json'], root)).items.length, 3);
});

test('pagination has deterministic bounds and a query-bound snapshot that rejects changed files or filters', async t => {
  const root = await fixture(t);
  const files = await Promise.all([5, 1, 4, 2, 3].map(n => file(root, signed(projection({ listingId: id(n) })), `${n}.json`)));
  const first = success(run(['listing', 'list', ...inputs(files), '--limit', '2', '--json'], root));
  assert.deepEqual(first.items.map(item => item.listing.listingId), [id(1), id(2)]);
  assert.deepEqual(first.pagination, { offset: 0, limit: 2, total: 5, nextOffset: 2 });
  const second = success(run(['listing', 'list', ...inputs([...files].reverse()), '--limit', '2', '--offset', '2', '--snapshot', first.source.snapshot, '--json'], root));
  assert.deepEqual(second.items.map(item => item.listing.listingId), [id(3), id(4)]);
  const last = success(run(['listing', 'list', ...inputs(files), '--offset', '4', '--limit', '2', '--snapshot', first.source.snapshot, '--json'], root));
  assert.deepEqual(last.items.map(item => item.listing.listingId), [id(5)]);
  assert.equal(last.pagination.nextOffset, null);
  assert.deepEqual(success(run(['listing', 'list', ...inputs(files), '--offset', '128', '--json'], root)).items, []);
  rejected(run(['listing', 'list', ...inputs(files.slice(1)), '--snapshot', first.source.snapshot, '--json'], root), 'SNAPSHOT_CHANGED');
  rejected(run(['listing', 'list', ...inputs(files), '--include-unavailable', '--snapshot', first.source.snapshot, '--json'], root), 'SNAPSHOT_CHANGED');
});

test('revision replacement and signed withdrawal are order independent and do not revive old selected publications', async t => {
  const root = await fixture(t);
  const original = signed();
  const edited = signed(projection({ revision: 2, title: 'Updated winter bicycle' }), { seq: 2, prev: original.cid });
  const withdrawn = withdrawal(edited);
  const files = [await file(root, original, 'original.json'), await file(root, edited, 'edited.json'), await file(root, withdrawn, 'withdrawn.json')];
  const latest = success(run(['listing', 'list', ...inputs([files[1], files[0]]), '--json'], root));
  assert.equal(latest.items[0].listing.title, 'Updated winter bicycle');
  for (const selection of [files, [...files].reverse(), [files[2], files[0], files[1], files[1]]]) {
    const result = success(run(['listing', 'list', ...inputs(selection), '--json'], root));
    assert.deepEqual(result.items, []);
    assert.equal(result.excludedSubjects, 1);
  }
  rejected(run(['listing', 'show', ...inputs(files), '--owner', author, '--id', listingId, '--json'], root), 'NOT_FOUND', 4);
  const standalone = success(run(['listing', 'list', '--file', files[2], '--json'], root));
  assert.deepEqual(standalone.items, []);
  assert.equal(standalone.verification.history, 'selected-files-only');
});

test('same-revision forks and inconsistent withdrawal targets fail the entire invocation without partial results', async t => {
  const root = await fixture(t);
  const original = signed();
  const conflicting = signed(projection({ title: 'Conflicting winter bicycle' }));
  const edited = signed(projection({ revision: 2 }), { seq: 2, prev: original.cid });
  const wrongTarget = withdrawal(edited, { target: original.cid });
  const files = await Promise.all([original, conflicting, edited, wrongTarget].map((record, n) => file(root, record, `${n}.json`)));
  for (const selection of [[files[0], files[1]], [files[1], files[0]], [files[0], files[1], files[2]], [files[2], files[3]]]) {
    rejected(run(['listing', 'list', ...inputs(selection), '--json'], root), 'HISTORY_CONFLICT');
  }
});

test('a different owner cannot withdraw a listing or substitute its author binding', async t => {
  const root = await fixture(t);
  const original = signed();
  const foreignWithdrawal = withdrawal(original, {}, OTHER_KEY);
  const files = [await file(root, original, 'original.json'), await file(root, foreignWithdrawal, 'foreign.json')];
  const retained = success(run(['listing', 'list', ...inputs(files), '--json'], root));
  assert.equal(retained.items.length, 1);
  assert.equal(retained.items[0].cid, original.cid);
  rejected(run(['listing', 'list', '--file', await file(root, withdrawal(original, { ownerId: author }, OTHER_KEY)), '--json'], root), 'INVALID_RECORD');
});

test('each selected record must pass shared admission, including expiry, private-field refusal and unknown types', async t => {
  const root = await fixture(t);
  const valid = await file(root, signed(), 'valid.json');
  for (const record of [
    { ...signed(), payload: projection({ title: 'Tampered title' }) },
    signed(projection({ expiresAt: new Date(now).toISOString() })),
    signed(projection({ privateNotes: secret })),
    signed(projection({ latitude: 49.3 })),
    signed(projection({ ownerId: otherAuthor })),
    signed({ private: secret }, { type: 'classrup.alpha.want/v1' }),
    signed(projection(), { createdAt: new Date(now + 600000).toISOString() }),
  ]) {
    const selected = await file(root, record);
    rejected(run(['search', ...inputs([valid, selected]), '--query', 'would not match', '--json'], root), 'INVALID_RECORD');
  }
});

test('human and machine output preserve public text without terminal escapes, bidi controls or raw extensions', async t => {
  const root = await fixture(t);
  const description = 'Public description\n\u001b[31mRED\r\u202eREVERSED\u2066ISOLATED\u2028NEXT\u2029PARAGRAPH';
  const record = signed(projection({ description }));
  const selected = await file(root, record);
  const args = ['listing', 'show', '--file', selected, '--id', listingId, '--owner', author];
  const human = run(args, root);
  assert.equal(human.status, 0, human.stderr);
  assert.equal(human.stderr, '');
  assert.ok(!/[\u001b\r\p{Cf}\p{Zl}\p{Zp}]/u.test(human.stdout));
  assert.match(human.stdout, /Description: "Public description\\n\\u001b\[31mRED\\r\\u202e/);
  assert.ok(!human.stdout.includes(secret));
  const machine = run([...args, '--json'], root);
  assert.deepEqual(success(machine).item.listing, record.payload);
  assert.ok(!/[\u001b\r\p{Cf}\p{Zl}\p{Zp}]/u.test(machine.stdout));
});

test('invalid arguments, private paths and duplicate singleton flags return stable redacted usage errors', async t => {
  const root = await fixture(t);
  const selected = await file(root, signed());
  for (const args of [
    ['listing'], ['listing', secret], ['listing', 'list'], ['search'],
    ['listing', 'list', '--file', '-'], ['listing', 'list', '--file', `https://example.invalid/${secret}`],
    ['listing', 'list', '--file', `\\\\server\\${secret}`], ['listing', 'list', '--file', '\\/server/share'],
    ['listing', 'list', '--file', '/\\server/share'], ['listing', 'list', '--file', selected, '--secret', secret],
    ['listing', 'list', '--file', selected, '--limit', '101'], ['listing', 'list', '--file', selected, '--limit', '0'],
    ['listing', 'list', '--file', selected, '--offset', '129'], ['listing', 'list', '--file', selected, '--offset', '-1'],
    ['listing', 'list', '--file', selected, '--limit', '2', '--limit', '3'], ['listing', 'list', '--file', selected, '--json'],
    ['listing', 'list', '--file', selected, '--snapshot', secret], ['listing', 'show', '--file', selected],
    ['listing', 'show', '--file', selected, '--id', listingId, '--owner', secret],
    ['listing', 'show', '--file', selected, '--id', listingId, '--owner', author + '1'.repeat(200)],
    ['listing', 'show', '--file', selected, '--id', id(1), '--owner', author, '--offset', '0'],
    ['search', '--file', selected, '--query', 'q'.repeat(121)], ['search', '--file', selected, '--region', 'invalid'],
    ['search', '--file', selected, '--category', secret], ['search', '--file', selected, '--kind', secret],
    ['search', '--file', selected, '--currency', 'CAD', '--min-price', '10', '--max-price', '9'],
    ['search', '--file', selected, '--currency', 'CAD', '--min-price', secret, '--max-price', '9'],
    ['search', '--file', selected, '--currency', 'CAD', '--min-price', '1', '--max-price', secret],
    ['search', '--file', selected, '--min-price', '10'], ['search', '--file', selected, '--currency', 'CAD', '--max-price', '01'],
  ]) rejected(run([...args, '--json'], root), 'USAGE');
});

test('bounded file count and aggregate bytes reject oversized selections, including repeated files', async t => {
  const root = await fixture(t);
  const selected = await file(root, signed());
  const maximum = await runPublicListingCommand('listing', ['list', ...inputs(Array(LISTING_LIMITS.files).fill(selected))], now);
  assert.equal(maximum.exitCode, 0);
  assert.equal(maximum.result.items.length, 1);
  assert.equal(maximum.result.source.filesRead, LISTING_LIMITS.files);
  rejected(run(['listing', 'list', ...inputs(Array(LISTING_LIMITS.files + 1).fill(selected)), '--json'], root), 'INPUT_LIMIT');
  const base = signed(projection(), { ext: { padding: '' } });
  const padding = 1048576 - Buffer.byteLength(JSON.stringify(base));
  const large = await file(root, signed(projection(), { ext: { padding: 'x'.repeat(padding) } }), 'large.json');
  assert.equal((await fs.stat(large)).size, 1048576);
  const aggregate = await runPublicListingCommand('listing', ['list', ...inputs(Array(17).fill(large))], now);
  assert.equal(aggregate.exitCode, 2);
  assert.equal(aggregate.result.error.code, 'INPUT_LIMIT');
});

test('malformed, unreadable, non-regular and oversized input errors do not disclose paths or input', async t => {
  const root = await fixture(t);
  const args = selected => ['listing', 'list', '--file', selected, '--json'];
  rejected(run(args(await file(root, `{ "${secret}": broken`)), root), 'INVALID_JSON');
  rejected(run(args(await file(root, Buffer.from([0xc3, 0x28]))), root), 'INVALID_JSON');
  rejected(run(args(root), root), 'FILE_INVALID');
  rejected(run(args(path.join(root, secret)), root), 'FILE_UNREADABLE', 3);
  rejected(run(args(await file(root, ' '.repeat(1048577))), root), 'FILE_TOO_LARGE');
  const selected = await file(root, signed());
  const link = path.join(root, 'link.json');
  try { await fs.symlink(selected, link); }
  catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    await fs.symlink(root, link, 'junction');
  }
  rejected(run(args(link), root), 'FILE_INVALID');
  const human = run(['listing', 'show', '--file', selected, '--owner', author, '--id', id(99)], root);
  assert.equal(human.status, 4);
  assert.equal(human.stdout, '');
  assert.equal(human.stderr, 'ClassRup: NOT_FOUND: No current listing for the selected owner and listing ID exists in the supplied public files.\n');
});

test('queries perform no network, key generation, signing, private-key import or persistent writes', async t => {
  const root = await fixture(t);
  const selected = await file(root, signed());
  const guard = path.join(root, 'deny-side-effects.mjs');
  await fs.writeFile(guard, `import { Socket } from 'node:net';
import { promises as fs, constants } from 'node:fs';
const deny = () => { throw new Error('Side effect forbidden'); };
Socket.prototype.connect = deny;
globalThis.fetch = deny;
for (const name of ['writeFile', 'appendFile', 'mkdir', 'rename', 'unlink', 'rm', 'symlink', 'link']) fs[name] = deny;
const open = fs.open;
fs.open = (file, flags, ...rest) => { if (typeof flags !== 'number' || (flags & (constants.O_WRONLY | constants.O_RDWR | constants.O_CREAT | constants.O_TRUNC))) deny(); return open(file, flags, ...rest); };
crypto.subtle.generateKey = deny;
crypto.subtle.sign = deny;
crypto.subtle.exportKey = deny;
const importKey = crypto.subtle.importKey.bind(crypto.subtle);
crypto.subtle.importKey = (...args) => { if (args[0] !== 'raw' || args[2] !== 'Ed25519' || args[3] !== false || args[4].join(',') !== 'verify') deny(); return importKey(...args); };
`);
  const nodeOptions = ['--import', pathToFileURL(guard).href];
  for (const args of [['listing', 'list'], ['listing', 'show', '--owner', author, '--id', listingId], ['search', '--query', 'winter']]) {
    assert.equal(success(run([...args, '--file', selected, '--json'], root, nodeOptions)).ok, true);
  }
  assert.deepEqual((await fs.readdir(root)).sort(), ['deny-side-effects.mjs', 'selected listing.json']);
  const help = run(['search', '--help'], root, nodeOptions);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /search --file FILE/);
});

test('runtime failures remain domain-specific redacted infrastructure errors', async t => {
  const root = await fixture(t);
  const result = spawnSync(process.execPath, [script, 'listing', 'list', '--file', secret, '--json'], {
    cwd: root, env: { ...env, npm_config_user_agent: `unsupported/${secret}` }, encoding: 'utf8', timeout: 15000,
  });
  assert.equal(rejected(result, 'INFRASTRUCTURE_FAILURE', 3).command, 'listing.list');
});

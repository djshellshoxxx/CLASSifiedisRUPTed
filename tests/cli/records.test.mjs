import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../../tools/cli/classrup.mjs';
import { readPublicRecord, verifyPublicRecord, RECORD_LIMITS } from '../../tools/cli/records.mjs';
import { didFromPublicKey } from '../../packages/security/src/index.ts';
import { verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions } from '../../packages/discovery/src/index.ts';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';

// RFC 8032 test seed. Sign through Node's native API and an independent JSON encoder,
// rather than the production signEnvelope or canonicalJson implementation.
const key = createPrivateKey({ format: 'der', type: 'pkcs8', key: Buffer.from('302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex') });
const publicBytes = createPublicKey(key).export({ format: 'der', type: 'spki' }).subarray(-32);
const author = didFromPublicKey(publicBytes);
const now = Date.now();
const listingId = '019a87d0-0000-7000-8000-000000000001';
const categoryId = '019a87d0-0000-7000-8000-000000000002';
const secret = 'PRIVATE_CONTENT_MUST_NOT_APPEAR';
const type = 'classrup.bazaar.listing/v1';
const script = path.join(ROOT, 'tools/cli/classrup.mjs');
const env = { ...process.env, npm_config_user_agent: 'pnpm/10.28.0' };

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
    description: `A winter bicycle. ${secret} \u001b[31m`, categoryId, condition: 'good', tags: [], locale: 'en',
    regionCell: 'c2b2', barterOptIn: true, availability: 'available', value: { currency: 'CAD', amount: '2500' },
    expiresAt: new Date(now + 86400000).toISOString(), ...changes };
}
function signed(payload = projection(), changes = {}) {
  const content = { v: 1, type, author, createdAt: new Date(now - 120000).toISOString(), seq: 1, prev: null,
    payload, ext: { note: secret }, ...changes };
  const cid = `sha256-${createHash('sha256').update(encode(content)).digest('hex')}`;
  const unsigned = { ...content, cid };
  return { ...unsigned, sig: sign(null, Buffer.from(encode(unsigned)), key).toString('base64url') };
}
function withdrawal(changes = {}) {
  return signed({ listingId, ownerId: author, revision: 2, target: signed().cid, reason: 'owner', ...changes },
    { type: 'classrup.alpha.tombstone/v1', seq: 2, prev: signed().cid });
}
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup records with spaces '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
async function file(root, value, name = 'signed record.json') {
  const selected = path.join(root, name);
  await fs.writeFile(selected, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
  return selected;
}
function run(args, cwd, nodeOptions = []) {
  return spawnSync(process.execPath, [...nodeOptions, script, 'record', ...args], { cwd, env, encoding: 'utf8', timeout: 15000 });
}
function rejected(result, status = 2, code = 'INVALID_RECORD') {
  assert.equal(result.error, undefined);
  assert.equal(result.status, status, result.stderr);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.command, 'record.verify');
  assert.equal(output.ok, false);
  assert.equal(output.error.code, code);
  assert.ok(!result.stdout.includes(secret));
  assert.ok(!result.stdout.includes('signed record.json'));
}

test('independent Ed25519 listing fixture verifies without configuration, persistence or payload disclosure', async t => {
  assert.equal(publicBytes.toString('hex'), 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
  const root = await fixture(t);
  const selected = await file(root, signed());
  const before = await fs.readFile(selected);
  const result = run(['verify', '--file', selected, '--json'], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(output).sort(), ['command', 'ok', 'record', 'schemaVersion', 'verification']);
  assert.equal(output.schemaVersion, 1);
  assert.equal(output.command, 'record.verify');
  assert.equal(output.ok, true);
  assert.deepEqual(output.record, { type, cid: signed().cid, author, listingId, revision: 1,
    createdAt: new Date(now - 120000).toISOString(), sequence: 1, previousCid: null });
  assert.deepEqual({ ...output.verification, checkedAt: undefined }, { checkedAt: undefined, signature: 'valid', contentHash: 'valid',
    payload: 'valid', authorBinding: 'valid', expiry: 'unexpired', chain: 'unchecked', history: 'unchecked', revocation: 'unchecked',
    currentOwnership: 'not-established', trust: 'not-established', admission: 'not-performed' });
  assert.ok(!result.stdout.includes(secret));
  assert.ok(!result.stdout.includes('\u001b'));
  assert.deepEqual(await fs.readFile(selected), before);
  assert.deepEqual(await fs.readdir(root), ['signed record.json']);
});

test('human output contains only verified metadata and explicit evidence limits', async t => {
  const root = await fixture(t);
  const result = run(['verify', '--file', await file(root, signed())], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /Verified public signed record/);
  assert.match(result.stdout, /Chain, retained history and revocation: unchecked/);
  assert.match(result.stdout, /Current ownership and trust: not established/);
  assert.ok(!result.stdout.includes(secret));
  assert.ok(!result.stdout.includes('\u001b'));
});

test('standalone signed withdrawal verifies without claiming its target or sequence history is known', async t => {
  const root = await fixture(t);
  const result = run(['verify', '--file', await file(root, withdrawal()), '--json'], root);
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.record.type, 'classrup.alpha.tombstone/v1');
  assert.equal(output.record.sequence, 2);
  assert.equal(output.verification.expiry, 'not-applicable');
  assert.equal(output.verification.chain, 'unchecked');
});

test('subprocess rejects tampering, wrong CID, invalid signature and unknown envelope fields', async t => {
  const root = await fixture(t);
  for (const record of [
    { ...signed(), payload: projection({ title: 'Tampered bicycle' }) },
    { ...signed(), cid: `sha256-${'0'.repeat(64)}` },
    { ...signed(), sig: Buffer.alloc(64).toString('base64url') },
    { ...signed(), privateKey: secret },
  ]) rejected(run(['verify', '--file', await file(root, record), '--json'], root));
});

test('subprocess rejects correctly signed unsupported types, substituted owners, private fields and expired records', async t => {
  const root = await fixture(t);
  const records = [
    signed({ privateMessage: secret }, { type: 'classrup.alpha.want/v1' }),
    signed(projection({ ownerId: 'did:key:another-owner' })),
    withdrawal({ ownerId: 'did:key:another-owner' }),
    signed(projection({ privateNotes: secret })),
    signed(projection({ latitude: 49.3 })),
    signed(projection({ expiresAt: new Date(now - 1).toISOString() })),
    signed(projection(), { createdAt: new Date(now + 600000).toISOString() }),
    signed(projection(), { v: 2 }),
    withdrawal({ reason: 'unsupported' }),
  ];
  for (const record of records) rejected(run(['verify', '--file', await file(root, record), '--json'], root));
});

test('shared validation preserves PWA retain acceptance and exact rejection codes', async () => {
  for (const [record, code] of [
    [signed(), null], [withdrawal(), null],
    [signed(projection({ ownerId: 'did:key:another-owner' })), 'FORBIDDEN'],
    [signed(projection({ privateNotes: secret })), 'FORBIDDEN'],
    [withdrawal({ reason: 'unsupported' }), 'VALIDATION_FAILED'],
    [withdrawal({ ownerId: 'did:key:another-owner' }), 'FORBIDDEN'],
    [signed(projection({ expiresAt: new Date(now).toISOString() })), 'PRECONDITION_FAILED'],
    [signed({}, { type: 'classrup.alpha.want/v1' }), 'VALIDATION_FAILED'],
  ]) {
    const kernel = createTestKernel({ start: now, definitions: discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now }) }).all });
    const retained = await kernel.cmd('discovery.listing.retain', { envelope: record });
    if (code === null) {
      assert.equal(retained.ok, true);
      assert.equal((await verifyPublicRecord(record, now)).ok, true);
    } else {
      assert.equal(retained.ok, false);
      assert.equal(retained.error.code, code);
      await assert.rejects(verifyPublicRecord(record, now));
      assert.equal(kernel.events.length, 0);
    }
  }
});

test('malformed JSON, invalid UTF-8, empty input and private input errors are redacted', async t => {
  const root = await fixture(t);
  for (const input of [`{"private":"${secret}",broken}`, '', Buffer.from([0xc3, 0x28])]) {
    rejected(run(['verify', '--file', await file(root, input), '--json'], root), 2, 'INVALID_JSON');
  }
  const result = run(['verify', '--file', await file(root, `{"${secret}":broken}`)], root);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'ClassRup: INVALID_JSON: Input must contain one valid UTF-8 JSON record.\n');
});

test('input size is bounded and overcomplex signed-domain JSON fails without disclosure', async t => {
  const root = await fixture(t);
  rejected(run(['verify', '--file', await file(root, ' '.repeat(RECORD_LIMITS.bytes + 1)), '--json'], root), 2, 'FILE_TOO_LARGE');
  rejected(run(['verify', '--file', await file(root, '['.repeat(80) + '0' + ']'.repeat(80)), '--json'], root));
});

test('actual descriptor read cap rejects a file that grows after both metadata checks', async t => {
  const root = await fixture(t);
  const selected = await file(root, signed());
  const originalOpen = fs.open;
  t.mock.method(fs, 'open', async (...args) => {
    const handle = await originalOpen(...args);
    let grown = false;
    return { stat: () => handle.stat(), close: () => handle.close(),
      async read(...input) {
        if (!grown) { grown = true; await fs.appendFile(selected, ' '.repeat(RECORD_LIMITS.bytes)); }
        return handle.read(...input);
      } };
  });
  await assert.rejects(readPublicRecord(selected), error => error.code === 'FILE_TOO_LARGE');
});

test('directories, final symlinks and missing files fail with stable exits', async t => {
  const root = await fixture(t);
  rejected(run(['verify', '--file', root, '--json'], root), 2, 'FILE_INVALID');
  rejected(run(['verify', '--file', path.join(root, secret), '--json'], root), 3, 'FILE_UNREADABLE');
  const selected = await file(root, signed());
  const link = path.join(root, 'linked.json');
  try { await fs.symlink(selected, link); }
  catch (error) {
    // Windows may deny file-symlink creation to a non-elevated account. A junction
    // still exercises the final-reparse-point rejection without enabling privileges.
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    await fs.symlink(root, link, 'junction');
  }
  rejected(run(['verify', '--file', link, '--json'], root), 2, 'FILE_INVALID');
});

test('FIFO and device inputs fail promptly without opening a stream', { skip: process.platform === 'win32' }, async t => {
  const root = await fixture(t);
  const fifo = path.join(root, 'pipe');
  const created = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
  assert.equal(created.status, 0, created.stderr);
  rejected(run(['verify', '--file', fifo, '--json'], root), 2, 'FILE_INVALID');
  rejected(run(['verify', '--file', '/dev/zero', '--json'], root), 2, 'FILE_INVALID');
});

test('unknown, repeated, missing, network and stdin options never echo supplied values', async t => {
  const root = await fixture(t);
  for (const args of [
    [], ['unknown'], ['verify'], ['verify', '--file'], ['verify', '--file', '-'],
    ['verify', '--secret', secret], ['verify', '--file', secret, '--file', secret],
    ['verify', '--file', secret, '--json'], ['verify', '--file', `https://example.invalid/${secret}`],
    ['verify', '--file', `\\\\server\\${secret}`], ['verify', '--file', '//server/path'],
    ['verify', '--file', '\\/server/share/record.json'], ['verify', '--file', '/\\server/share/record.json'],
  ]) rejected(run([...args, '--json'], root), 2, 'USAGE');
});

test('runtime dependency failures use the fixed domain infrastructure error', async t => {
  const root = await fixture(t);
  const result = spawnSync(process.execPath, [script, 'record', 'verify', '--file', secret, '--json'], {
    cwd: root, env: { ...env, npm_config_user_agent: `unsupported/${secret}` }, encoding: 'utf8', timeout: 15000,
  });
  rejected(result, 3, 'INFRASTRUCTURE_FAILURE');
});

test('record verification performs no network connection and help needs no setup', async t => {
  const root = await fixture(t);
  const selected = await file(root, signed());
  const guard = path.join(root, 'deny-network.mjs');
  await fs.writeFile(guard, `import { Socket } from 'node:net';\nSocket.prototype.connect = function () { throw new Error('Network forbidden'); };\nglobalThis.fetch = () => { throw new Error('Network forbidden'); };\n`);
  const result = run(['verify', '--file', selected, '--json'], root, ['--import', pathToFileURL(guard).href]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).ok, true);
  const help = run(['verify', '--help'], root);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /record verify --file FILE \[--json\]/);
});

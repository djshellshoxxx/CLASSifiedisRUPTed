import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createMemoryStorage, defineRepo, z } from '../../../../../packages/kernel/src/index.ts';
import { unseal } from '../../../../../packages/identity/src/index.ts';
import { verifyEnvelope } from '../../../../../packages/federation/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../../../../packages/vault/src/vault.ts';

// Independent native Node probes of the real candidate; no crypto or storage mocks.
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const passphrase = 'independent preflight generation three probe';
const note = defineRepo({ type: 'test.preflight_g3', schema: z.strictObject({ id: z.string(), state: z.string() }), indexes: { state: data => data.state } });
const added = defineRepo({ type: 'test.preflight_g3_added', schema: z.strictObject({ enabled: z.boolean() }), indexes: {} });
const original = [{ id: 'alpha', state: 'original' }, { id: 'beta', state: 'original' }];
const steps = [];
const completed = [];
let mode = 'reject-original';
const sourceCodec = {
  ...backupCodec(note),
  recordId(input) { return note.schema.parse(input).id; },
  async restoreData(input) {
    steps.push(`normalize:${input.id}:${input.state}`);
    input.state = 'recovered';
    return input;
  },
  async validate(input) {
    steps.push(`validate:${input.id}:${input.state}`);
    if (mode === 'reject-original' && input.state === 'original') throw new Error('original evidence rejected');
    if (mode === 'reject-normalized' && input.state === 'recovered') throw new Error('normalized evidence rejected');
    input.state = 'validator-only';
  },
};
const source = vaultFromStorage(createMemoryStorage(), [sourceCodec]);
let destination;
try {
  const session = await source.create(passphrase);
  for (const data of original) {
    const saved = await session.storage.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: data.id, data, idx: ['original', null, null, null], expectedRevision: 0, now: 0 }));
    assert.equal(saved.ok, true);
  }
  const message = new Uint8Array([3, 1, 4, 1, 5]);
  const signature = await session.identity.sign(message);
  const sourceRows = () => session.storage.read(tx => tx.records.query({ tenant: session.principal, type: note.type, filters: [], orderSlot: 0, dir: 'asc', limit: 10 }));
  const sourceSnapshot = await sourceRows();

  await assert.rejects(session.exportBackup(passphrase), /original evidence rejected/);
  assert.deepEqual(steps, ['validate:alpha:original']);
  assert.deepEqual(await sourceRows(), sourceSnapshot);
  completed.push('export rejects original evidence before invoking recovery normalization');

  mode = 'reject-normalized';
  steps.length = 0;
  await assert.rejects(session.exportBackup(passphrase), /normalized evidence rejected/);
  assert.deepEqual(steps, ['validate:alpha:original', 'normalize:alpha:original', 'validate:alpha:recovered']);
  assert.deepEqual(await sourceRows(), sourceSnapshot);
  assert.deepEqual(await session.identity.sign(message), signature);
  completed.push('export rejects normalized evidence and preserves source rows and signing identity');

  mode = 'accept';
  steps.length = 0;
  const backup = await session.exportBackup(passphrase);
  const bytes = await unseal(backup, passphrase);
  try {
    const manifest = await verifyEnvelope(JSON.parse(new TextDecoder().decode(bytes)), { expectedType: 'classrup.vault.alpha_backup/v1' });
    assert.equal(manifest.v, 1);
    assert.equal(manifest.author, session.principal);
    assert.deepEqual(Object.keys(manifest.payload).sort(), ['principal', 'protectedIdentity', 'recordTypes', 'records']);
    assert.deepEqual(manifest.payload.recordTypes, [note.type]);
    assert.deepEqual(manifest.payload.records, sourceSnapshot);
  } finally { bytes.fill(0); }
  assert.deepEqual(await sourceRows(), sourceSnapshot);
  completed.push('successful export signs original v1 records despite mutating normalizer and validator');

  const rawDestination = createMemoryStorage();
  const conflict = await rawDestination.transaction(tx => tx.records.put({ tenant: session.principal, type: note.type, id: 'beta', data: { id: 'beta', state: 'existing' }, idx: ['existing', null, null, null], expectedRevision: 0, now: 1 }));
  assert.equal(conflict.ok, true);
  const restoreSteps = [];
  const destinationCodec = {
    ...backupCodec(note),
    recordId(input) { return note.schema.parse(input).id; },
    async restoreData(input) {
      restoreSteps.push(`normalize:${input.id}:${input.state}`);
      input.state = 'recovered';
      return input;
    },
    async validate(input) {
      restoreSteps.push(`validate:${input.id}:${input.state}`);
      assert.equal(input.state, 'recovered');
      input.state = 'validator-only';
    },
  };
  destination = vaultFromStorage(rawDestination, [destinationCodec, backupCodec(added)]);
  await assert.rejects(destination.restoreBackup(backup, passphrase), /Backup restore conflict/);
  assert.deepEqual(restoreSteps, ['normalize:alpha:original', 'validate:alpha:recovered', 'normalize:beta:original', 'validate:beta:recovered']);
  assert.equal(await destination.isInitialized(), false);
  await rawDestination.read(tx => {
    assert.equal(tx.records.get(session.principal, note.type, 'alpha'), undefined);
    assert.deepEqual(tx.records.get(session.principal, note.type, 'beta'), conflict.value);
    assert.equal(tx.records.get('local-vault', 'vault.identity', 'root'), undefined);
    assert.equal(tx.records.query({ tenant: session.principal, type: note.type, filters: [{ slot: 1, op: 'eq', value: 'recovered' }], orderSlot: 0, dir: 'asc', limit: 10 }).length, 0);
  });
  completed.push('restore conflict rolls back the new identity, earlier normalized rows and rebuilt indexes');

  const removed = await rawDestination.transaction(tx => tx.records.remove(session.principal, note.type, 'beta', 1));
  assert.equal(removed.ok, true);
  restoreSteps.length = 0;
  const restored = await destination.restoreBackup(backup, passphrase);
  assert.equal(restored.principal, session.principal);
  assert.deepEqual(await restored.identity.sign(message), signature);
  const rows = await restored.storage.read(tx => tx.records.query({ tenant: restored.principal, type: note.type, filters: [{ slot: 1, op: 'eq', value: 'recovered' }], orderSlot: 0, dir: 'asc', limit: 10 }));
  assert.deepEqual(rows, sourceSnapshot.map(row => ({ ...row, data: { ...row.data, state: 'recovered' } })));
  assert.deepEqual(restoreSteps, ['normalize:alpha:original', 'validate:alpha:recovered', 'normalize:beta:original', 'validate:beta:recovered']);
  assert.deepEqual((await restored.backupCoverage()).registeredRecordTypes, [note.type, added.type]);
  assert.deepEqual(await sourceRows(), sourceSnapshot);
  completed.push('retry restores the older subset scope with preserved identity and metadata, normalized-only validation and rebuilt indexes');

  console.log(JSON.stringify({ sourceCommit, completed: completed.length, probes: completed }, null, 2));
} finally {
  await destination?.close();
  await source.close();
}

import assert from 'node:assert/strict';
import { createMemoryStorage, createStorage } from '../../../../../packages/kernel/src/storage/storage.ts';
import { createMemoryDriver } from '../../../../../packages/kernel/src/storage/memory-driver.ts';
import { openSqliteStorage } from '../../../../../packages/kernel/src/storage/sqlite.ts';
import { ok, err } from '../../../../../packages/kernel/src/errors/result.ts';
import { describeBackupCoverage } from '../../../../../apps/pwa/src/backup-coverage.ts';

const completed = [];
for (const [adapter, storage] of [['memory', createMemoryStorage()], ['sqlite', openSqliteStorage({ path: ':memory:' })]]) {
  try {
    await storage.transaction(tx => {
      for (let i = 0; i < 260; i++) {
        const result = tx.records.put({ tenant: 'owner', type: `type.${String(i).padStart(3, '0')}`, id: 'one', data: { private: 'not part of inventory' }, idx: [null, null, null, null], expectedRevision: 0, now: 0 });
        assert.equal(result.ok, true);
      }
      assert.equal(tx.records.put({ tenant: "owner' OR 1=1 --", type: 'private.foreign', id: 'one', data: {}, idx: [null, null, null, null], expectedRevision: 0, now: 0 }).ok, true);
      return ok(undefined);
    });
    const report = await storage.read(tx => tx.records.listTypes('owner', 257));
    assert.equal(report.length, 257);
    assert.equal(report[0].type, 'type.000');
    assert.equal(report.at(-1).type, 'type.256');
    assert.equal(report.every(row => row.count === 1 && Object.keys(row).sort().join(',') === 'count,type'), true);
    assert.equal(JSON.stringify(report).includes('private'), false);
    assert.deepEqual(await storage.read(tx => tx.records.listTypes("owner' OR 1=1 --", 10)), [{ type: 'private.foreign', count: 1 }]);
    completed.push(`${adapter}: 257-entry overflow sentinel, exact tenant and payload-free counts`);

    const rejected = await storage.transaction(tx => {
      assert.equal(tx.records.put({ tenant: 'owner', type: 'rollback.type', id: 'one', data: {}, idx: [null, null, null, null], expectedRevision: 0, now: 0 }).ok, true);
      assert.equal(tx.records.listTypes('owner', 10001).some(row => row.type === 'rollback.type'), true);
      return err('intentional rollback');
    });
    assert.equal(rejected.ok, false);
    assert.equal((await storage.read(tx => tx.records.listTypes('owner', 10001))).some(row => row.type === 'rollback.type'), false);
    completed.push(`${adapter}: inventory observes transaction rollback`);

    const detached = await storage.read(tx => tx.records.listTypes);
    assert.throws(() => detached('owner', 1), /Transaction is no longer active/);
    await storage.read(tx => {
      for (const bad of [0, -1, NaN, Infinity, 1.1, 10002, '1']) assert.throws(() => tx.records.listTypes('owner', bad), RangeError);
    });
    completed.push(`${adapter}: detached method and invalid limits rejected`);
  } finally { await storage.close(); }
}

const malformed = createStorage(createMemoryDriver({ snapshot: { records: [['owner\u0001type.bad\u0001one', {
  tenant: 'owner', type: 'type.bad', id: 'one', revision: 1, data: '{malformed', idx: [null, null, null, null], createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
}]] } }));
try {
  assert.deepEqual(await malformed.read(tx => tx.records.listTypes('owner', 10)), [{ type: 'type.bad', count: 1 }]);
  await assert.rejects(malformed.read(tx => tx.records.get('owner', 'type.bad', 'one')), SyntaxError);
  completed.push('memory: inventory does not deserialize payloads; normal record access still rejects malformed JSON');
} finally { await malformed.close(); }

const untrusted = '<img src=x onerror=secret>';
const text = describeBackupCoverage({ recordTypes: [{ type: untrusted, count: 1 }], registeredRecordTypes: [], unsupportedRecordTypes: [untrusted], recordCount: 1, recordLimitExceeded: false, typeLimitExceeded: false, excludedStores: [] });
assert.match(text, /Backup blocked/);
assert.equal(text.includes(untrusted), false);
completed.push('UI formatter: unsupported type identifiers are not interpolated');
console.log(JSON.stringify({ completed: completed.length, probes: completed }, null, 2));

// Reviewer characterization probe for 085aa1e; run with Node >= 22.18 from the repository root.
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createFakeClock } from '../../../../../packages/kernel/src/clock/clock.ts';
import { appError } from '../../../../../packages/kernel/src/errors/app-error.ts';
import { err, ok } from '../../../../../packages/kernel/src/errors/result.ts';
import { createMemoryStorage } from '../../../../../packages/kernel/src/storage/storage.ts';
import { openIndexedDbStorage } from '../../../../../packages/kernel/src/storage/indexeddb.ts';
import { openSqliteStorage } from '../../../../../packages/kernel/src/storage/sqlite.ts';
import { migrationStatus, runMigrations } from '../../../../../packages/kernel/src/storage/migrations.ts';

const at = '2026-11-19T00:00:00.000Z';
const now = Date.parse(at);
const tenant = 'review-g3';
const accept = result => { assert.equal(result.ok, true); return result.value; };
const ids = (tx, type, orderSlot, dir = 'asc', after) => tx.records.query({ tenant, type, orderSlot, dir, filters: [], limit: 20, ...(after ? { after } : {}) }).map(row => row.id);
const migrations = tx => tx.migrations.list().filter(row => row.id.startsWith('g3:'));

for (const [name, open] of [
  ['memory', async () => createMemoryStorage()],
  ['fake-indexeddb', () => openIndexedDbStorage({ name: 'storage-review-g3', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
]) {
  const storage = await open();
  try {
    const inputs = [
      ['a', ['beta', 'one', 'same', null]],
      ['b', ['alpha', 'two', 'same', 'last']],
      ['c', [null, 'zero', 'tail', 'first']],
      ['d', ['alpha', null, 'same', 'first']],
    ];
    const order = [
      ['a', 'b', 'c', 'd'], ['b', 'd', 'a'], ['a', 'b', 'c'], ['a', 'b', 'd', 'c'], ['c', 'd', 'b'],
    ];
    const checkOrder = tx => {
      for (let slot = 0; slot <= 4; slot++) {
        assert.deepEqual(ids(tx, 'review.order', slot), order[slot]);
        assert.deepEqual(ids(tx, 'review.order', slot, 'desc'), [...order[slot]].reverse());
      }
      assert.deepEqual(ids(tx, 'review.order', 1, 'asc', { value: 'alpha', id: 'b' }), ['d', 'a']);
      assert.deepEqual(ids(tx, 'review.order', 1, 'desc', { value: 'alpha', id: 'd' }), ['b']);
    };
    accept(await storage.transaction(tx => {
      for (const [id, idx] of inputs) {
        assert.equal(accept(tx.records.put({ tenant, type: 'review.order', id, data: { id }, idx, expectedRevision: 0, now })).revision, 1);
        idx.fill('mutated-before-commit');
      }
      checkOrder(tx);
      return ok(undefined);
    }));
    for (const [, idx] of inputs) idx.fill('mutated-after-commit');
    await storage.read(checkOrder);

    const updateIdx = ['delta', 'two', 'same', 'last'];
    const updated = accept(await storage.transaction(tx => {
      const result = tx.records.put({ tenant, type: 'review.order', id: 'b', data: { id: 'b', edited: true }, idx: updateIdx, expectedRevision: 1, now: now + 1000 });
      updateIdx.fill('mutated-update');
      return result;
    }));
    assert.equal(updated.revision, 2);
    assert.equal(updated.createdAt, at);
    assert.equal(updated.updatedAt, '2026-11-19T00:00:01.000Z');
    const stale = await storage.transaction(tx => tx.records.put({ tenant, type: 'review.order', id: 'b', data: {}, idx: ['bad', null, null, null], expectedRevision: 1, now }));
    assert.equal(stale.ok, false);
    assert.equal(stale.error.code, 'CONFLICT_REVISION');
    assert.equal(stale.error.params.currentRevision, 2);
    await storage.read(tx => {
      assert.deepEqual(ids(tx, 'review.order', 1), ['d', 'a', 'b']);
      assert.deepEqual(tx.records.get(tenant, 'review.order', 'b'), updated);
    });

    const restored = { tenantId: tenant, type: 'review.restore', id: 'restored', revision: 7, data: { imported: true }, createdAt: '2026-11-18T00:00:00.000Z', updatedAt: at };
    const restoreIdx = [null, 'second', 'third', 'fourth'];
    assert.equal(accept(await storage.transaction(tx => {
      const result = tx.records.restore(restored, restoreIdx);
      restoreIdx.fill('mutated-restore');
      return result;
    })), 'restored');
    assert.equal(accept(await storage.transaction(tx => tx.records.restore(restored, ['ignored', 'ignored', 'ignored', 'ignored']))), 'identical');
    const conflict = await storage.transaction(tx => tx.records.restore({ ...restored, data: { imported: false } }, [null, null, null, null]));
    assert.equal(conflict.ok, false);
    assert.equal(conflict.error.code, 'CONFLICT_REVISION');
    await storage.read(tx => {
      assert.deepEqual(tx.records.get(tenant, restored.type, restored.id), restored);
      assert.deepEqual(ids(tx, restored.type, 1), []);
      for (const [slot, value] of [[2, 'second'], [3, 'third'], [4, 'fourth']]) {
        assert.deepEqual(tx.records.query({ tenant, type: restored.type, filters: [{ slot, op: 'eq', value }], orderSlot: slot, dir: 'asc', limit: 2 }).map(row => row.id), ['restored']);
      }
    });

    const expectedRows = [
      { id: 'g3:z', checksum: 'sum-z', appliedAt: '2026-11-18T00:00:00.000Z' },
      { id: 'g3:a', checksum: 'sum-a', appliedAt: at },
      { id: 'g3:b', checksum: 'sum-b', appliedAt: at },
    ];
    accept(await storage.transaction(tx => {
      for (const expected of [expectedRows[2], expectedRows[0], expectedRows[1]]) {
        const row = { ...expected };
        tx.migrations.insert(row);
        Object.assign(row, { id: 'mutated', checksum: 'mutated', appliedAt: '2030-01-01T00:00:00.000Z' });
      }
      assert.deepEqual(migrations(tx), expectedRows);
      return ok(undefined);
    }));
    let retained;
    await assert.rejects(storage.read(tx => {
      retained = migrations(tx);
      for (const row of retained) Object.assign(row, { id: 'mutated-read', checksum: 'mutated-read', appliedAt: '2030-01-01T00:00:00.000Z' });
      assert.deepEqual(migrations(tx), expectedRows);
      throw new Error('review read rollback');
    }), /review read rollback/);
    for (const row of retained) row.checksum = 'mutated-after-read';
    assert.deepEqual(await storage.read(migrations), expectedRows);

    const clock = createFakeClock(at);
    const calls = [];
    const steps = ['g3:run-z', 'g3:run-a'].map(id => ({ id, up: () => { calls.push(id); return ok(undefined); } }));
    assert.deepEqual(accept(await runMigrations(storage, steps, clock)), steps.map(step => step.id));
    assert.deepEqual(accept(await runMigrations(storage, steps, clock)), []);
    assert.deepEqual(calls, steps.map(step => step.id));
    const broken = { id: 'g3:run-broken', up: tx => {
      accept(tx.records.put({ tenant, type: 'review.rollback', id: 'should-not-exist', data: {}, idx: [null, null, null, null], expectedRevision: 0, now }));
      return err(appError('PRECONDITION_FAILED'));
    } };
    assert.equal((await runMigrations(storage, [...steps, broken], clock)).ok, false);
    assert.deepEqual((await migrationStatus(storage, [...steps, broken])).pending, [broken.id]);
    assert.equal(await storage.read(tx => tx.records.get(tenant, 'review.rollback', 'should-not-exist')), undefined);
    await assert.rejects(runMigrations(storage, [steps[0], steps[0]], clock), /duplicate migration id/);
    assert.deepEqual(await storage.read(tx => migrations(tx).filter(row => row.id.startsWith('g3:run-'))), [
      { id: 'g3:run-a', checksum: 'data', appliedAt: at },
      { id: 'g3:run-z', checksum: 'data', appliedAt: at },
    ]);
    console.log(`${name}: PASS (four-slot ordering, revision/CAS, restore, migration isolation/order/repeat/rollback)`);
  } finally {
    await storage.close();
  }
}
console.log('Completed three adapter scenarios; these are reviewer probes, not additional Vitest test cases.');

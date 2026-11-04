import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { ok } from '../errors/result.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { createIndexedDbDriver, openIndexedDbStorage, VAULT_DB_VERSION } from './indexeddb.ts';
import { defineRepo } from './repo.ts';
import { writeScope } from './scope.ts';
import { createStorage } from './storage.ts';
import type { Tx } from './tx.ts';

const clock = createFakeClock('2026-11-04T10:00:00.000Z');
const ids = createDeterministicIds({ seed: 5, now: () => clock.now() });
const draft = defineRepo({ type: 'test.draft', schema: z.strictObject({ title: z.string() }) });
const repo = (tx: Tx) => writeScope({ tx, tenantId: 'vault-1', clock, ids, deliveryEligible: false }).repo(draft);

function rawOpen(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(name, VAULT_DB_VERSION);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

describe('IndexedDB vault adapter (PS-119)', () => {
  it('TEST-PS-119-09.T08 commits persist across reopen; a failed IndexedDB commit restores the working set to the last commit', async () => {
    const factory = new IDBFactory();
    const s1 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory });
    await s1.transaction((tx) => repo(tx).put('d1', { title: 'first' }, { expectedRevision: 0 }));
    await s1.transaction((tx) => ok(tx.outbox.append({ eventId: 'e1', type: 'test.draft.saved', version: 1, tenantId: 'vault-1', aggregate: { type: 'draft', id: 'd1' }, revision: 1, actor: { kind: 'user', id: 'u' }, occurredAt: clock.iso(), correlationId: 'c', causationId: 'c', privacy: 'P3', payload: {}, provenance: { origin: 'vault', sig: null } })));
    await s1.close();
    const s2 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory });
    expect(await s2.read((tx) => repo(tx).get('d1')?.data)).toEqual({ title: 'first' });
    const seq = await s2.transaction((tx) => ok(tx.outbox.append({ ...((tx.outbox.get('e1') ?? {}) as never), eventId: 'e2' })));
    expect(seq.ok && seq.value).toBe(2);
    await s2.close();

    const db = await rawOpen(factory, 'vault-a');
    let fail = true;
    const flaky = new Proxy(db, {
      get(target, prop) {
        if (prop === 'transaction') {
          return (stores: string[], mode: IDBTransactionMode) => {
            if (fail && mode === 'readwrite') throw new DOMException('quota exceeded', 'QuotaExceededError');
            return target.transaction(stores, mode);
          };
        }
        const v = Reflect.get(target, prop) as unknown;
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
      },
    });
    const s3 = createStorage(createIndexedDbDriver(flaky, {}));
    await expect(s3.transaction((tx) => repo(tx).put('d2', { title: 'lost' }, { expectedRevision: 0 }))).rejects.toThrow('quota');
    expect(await s3.read((tx) => repo(tx).get('d2'))).toBeUndefined();
    fail = false;
    expect((await s3.transaction((tx) => repo(tx).put('d3', { title: 'kept' }, { expectedRevision: 0 }))).ok).toBe(true);
    await s3.close();
    const s4 = await openIndexedDbStorage({ name: 'vault-a', indexedDB: factory });
    expect(await s4.read((tx) => [repo(tx).get('d1')?.revision, repo(tx).get('d2'), repo(tx).get('d3')?.data])).toEqual([1, undefined, { title: 'kept' }]);
    await s4.close();
  });
});

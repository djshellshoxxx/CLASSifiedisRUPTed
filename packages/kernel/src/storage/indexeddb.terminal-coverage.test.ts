import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { RecordRow } from './driver.ts';
import { createIndexedDbDriver, openIndexedDbConnection, VAULT_DB_VERSION, type VaultLocks } from './indexeddb.ts';

function rawOpen(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, VAULT_DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Snapshot the internal fence before any retry can replace it. This is
// deliberately a raw test-only read: the production snapshot hides the fence.
async function readWriterClaim(factory: IDBFactory, name: string): Promise<unknown> {
  const db = await rawOpen(factory, name);
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const request = tx.objectStore('meta').get('writer');
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('fixture writer read aborted'));
    });
  } finally { db.close(); }
}

const row = (id: string, title: string, revision = 1): RecordRow => ({
  tenant: 'owner', type: 'test.note', id, revision, data: JSON.stringify({ title }),
  idx: [title, null, null, null], createdAt: '2026-11-27T00:00:00.000Z',
  updatedAt: '2026-11-27T00:00:00.000Z',
});

function observeOpen(factory: IDBFactory, opened: (db: IDBDatabase) => void): IDBFactory {
  return new Proxy(factory, { get(target, property) {
    if (property === 'open') return (name: string, version?: number) => {
      const request = target.open(name, version);
      request.addEventListener('success', () => opened(request.result));
      return request;
    };
    const value: unknown = Reflect.get(target, property, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}

describe('IndexedDB terminal settlement follow-on coverage (PS-119)', () => {
  it('TEST-PS-119-09.T08 unfenced driver rolls back queued native writes and its working set before retry', async () => {
    const factory = new IDBFactory();
    const name = 'unfenced-terminal-write';
    // Establish the production schema, then use the explicitly unfenced
    // driver entrypoint, which is exported for failure-injection tests.
    const initialized = await openIndexedDbConnection({ name, indexedDB: factory });
    await initialized.close();
    const db = await rawOpen(factory, name);
    const driver = createIndexedDbDriver(db, {});
    const original = row('first', 'original');
    const failure = new DOMException('fixture second put rejected', 'DataCloneError');
    const events: string[] = [];
    let puts = 0;
    const transaction = db.transaction.bind(db);
    try {
      driver.begin('write').records.upsert(original);
      await driver.commit();

      // Valid rows survive the memory driver's structuredClone boundary.
      // Inject the failure at the native scheduling boundary instead.
      db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
        const tx = transaction(...args);
        if (args[1] === 'readwrite') {
          tx.addEventListener('abort', () => events.push('abort'));
          const objectStore = tx.objectStore.bind(tx);
          tx.objectStore = (storeName: string) => {
            const store = objectStore(storeName);
            const put = store.put.bind(store);
            store.put = (...putArgs: Parameters<IDBObjectStore['put']>) => {
              if (++puts === 2) throw failure;
              const request = put(...putArgs);
              events.push('first-put-queued');
              return request;
            };
            return store;
          };
        }
        return tx;
      };
      const write = driver.begin('write');
      write.records.upsert(row('first', 'must roll back', 2));
      write.records.upsert(row('second', 'must not persist'));
      await expect(driver.commit()).rejects.toBe(failure);
      expect(puts).toBe(2);
      expect(events).toEqual(['first-put-queued', 'abort']);

      const read = driver.begin('read');
      expect(read.records.get('owner', 'test.note', 'first')).toEqual(original);
      expect(read.records.get('owner', 'test.note', 'second')).toBeUndefined();
      await driver.commit();
      db.transaction = transaction;

      // Inspect actual durable state before retry, rather than allowing a
      // later successful write to hide a partial commit.
      const durable = await openIndexedDbConnection({ name, indexedDB: factory });
      try {
        expect((await durable.snapshot()).records?.map(([, value]) => value)).toEqual([original]);
      } finally { await durable.close(); }

      const kept = row('third', 'kept');
      driver.begin('write').records.upsert(kept);
      await driver.commit();
    } finally {
      db.transaction = transaction;
      await driver.close();
    }
    const reopened = await openIndexedDbConnection({ name, indexedDB: factory });
    try {
      expect((await reopened.snapshot()).records?.map(([, value]) => value))
        .toEqual([original, row('third', 'kept')]);
    } finally { await reopened.close(); }
  });

  it('TEST-PS-119-09.T08 writer claim failure drains native abort before releasing lease and permits clean retry', async () => {
    const factory = new IDBFactory();
    const name = 'writer-claim-terminal-failure';
    const events: string[] = [];
    let held = false;
    const locks: VaultLocks = {
      async request(_name, _options, callback) {
        if (held) return callback(null);
        held = true;
        try { return await callback({}); }
        finally { events.push('lease-release'); held = false; }
      },
    };
    const seed = await openIndexedDbConnection({
      name, indexedDB: factory, locks, random: bytes => { bytes.fill(1); },
    });
    try { await seed.persist([{ table: 'meta', key: 'saved', row: { value: 17 } }]); }
    finally { await seed.close(); }
    events.length = 0;
    const originalClaim = await readWriterClaim(factory, name);
    expect(originalClaim).toEqual({ token: 'AQEBAQEBAQEBAQEBAQEBAQ' });
    const failure = new Error('fixture writer claim scheduling failure');
    const failing = observeOpen(factory, db => {
      const transaction = db.transaction.bind(db);
      db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
        const tx = transaction(...args);
        if (args[1] === 'readwrite') {
          tx.addEventListener('abort', () => events.push('abort'));
          const objectStore = tx.objectStore.bind(tx);
          tx.objectStore = (storeName: string) => {
            const store = objectStore(storeName);
            const put = store.put.bind(store);
            store.put = (...putArgs: Parameters<IDBObjectStore['put']>) => {
              put(...putArgs);
              events.push('claim-put-queued');
              throw failure;
            };
            return store;
          };
        }
        return tx;
      };
    });
    await expect(openIndexedDbConnection({
      name, indexedDB: failing, locks, random: bytes => { bytes.fill(2); },
    })).rejects.toBe(failure);
    expect(events).toEqual(['claim-put-queued', 'abort', 'lease-release']);
    expect(held).toBe(false);
    // The rejected claim must not supersede the old fence; checking only
    // saved records after a new claim would conceal a partial fence update.
    expect(await readWriterClaim(factory, name)).toEqual(originalClaim);

    const retry = await openIndexedDbConnection({
      name, indexedDB: factory, locks, random: bytes => { bytes.fill(3); },
    });
    try {
      expect(await readWriterClaim(factory, name)).toEqual({ token: 'AwMDAwMDAwMDAwMDAwMDAw' });
      expect((await retry.snapshot()).meta).toEqual([['saved', { value: 17 }]]);
      await retry.persist([{ table: 'meta', key: 'saved', row: { value: 18 } }]);
    } finally { await retry.close(); }
    const reopened = await openIndexedDbConnection({ name, indexedDB: factory, locks });
    try { expect((await reopened.snapshot()).meta).toEqual([['saved', { value: 18 }]]); }
    finally { await reopened.close(); }
  });
});

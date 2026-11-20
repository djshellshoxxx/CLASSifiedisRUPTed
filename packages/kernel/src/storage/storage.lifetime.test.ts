import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { err, ok } from '../errors/result.ts';
import { createStorage, createMemoryStorage, type Storage } from './storage.ts';
import { createMemoryDriver } from './memory-driver.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import type { Tx } from './tx.ts';

const put = (id: string) => ({ tenant: 'owner', type: 'test.note', id, data: { text: id }, idx: [null, null, null, null] as const, expectedRevision: 0, now: Date.now() });
const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'transaction-lifetime', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
];

for (const [name, open] of adapters) describe(`${name} transaction lifetime`, () => {
  it('revokes a synchronous callback before its queued microtasks execute', async () => {
    const storage = await open();
    let late!: Promise<unknown>;
    try {
      await storage.transaction(tx => {
        late = new Promise(resolve => queueMicrotask(() => {
          try { resolve(tx.records.put(put('microtask'))); } catch (error) { resolve(error); }
        }));
        return ok(undefined);
      });
      expect(await late).toEqual(new Error('Transaction is no longer active'));
      expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'microtask'))).toBeUndefined();
    } finally { await storage.close(); }
  });

  it('revokes a synchronous read before its queued microtasks execute', async () => {
    const storage = await open();
    let late!: Promise<unknown>;
    try {
      await storage.transaction(tx => tx.records.put(put('existing')));
      const value = await storage.read(tx => {
        late = new Promise(resolve => queueMicrotask(() => {
          try { resolve(tx.records.get('owner', 'test.note', 'existing')); } catch (error) { resolve(error); }
        }));
        return tx.records.get('owner', 'test.note', 'existing');
      });
      expect(value?.revision).toBe(1);
      expect(await late).toEqual(new Error('Transaction is no longer active'));
    } finally { await storage.close(); }
  });

  it('preserves null, plain values and thenables returned by a read callback', async () => {
    const storage = await open();
    try {
      expect(await storage.read(() => null)).toBeNull();
      expect(await storage.read(() => 0)).toBe(0);
      expect(await storage.read(() => ({ then: 'ordinary data' }))).toEqual({ then: 'ordinary data' });
      // Native await supported thenables before the lifetime fix; preserve that behavior.
      const thenable = { then(resolve: (value: string) => void) { queueMicrotask(() => resolve('settled')); } };
      expect(await storage.read<typeof thenable>(() => thenable)).toBe('settled');
    } finally { await storage.close(); }
  });

  it.each(['commit', 'error', 'throw', 'read'] as const)('revokes retained reads, writes and detached methods after %s', async ending => {
    const storage = await open();
    let retained!: Tx;
    try {
      if (ending === 'read') await storage.read(tx => { retained = tx; });
      else {
        const outcome = storage.transaction(tx => {
          retained = tx;
          tx.records.put(put('inside'));
          if (ending === 'throw') throw new Error('injected handler failure');
          return ending === 'error' ? err('injected validation failure') : ok(undefined);
        });
        if (ending === 'throw') await expect(outcome).rejects.toThrow('injected handler failure');
        else expect((await outcome).ok).toBe(ending === 'commit');
      }
      const detached = retained.records.get;
      expect(() => retained.records.put(put('outside'))).toThrow('Transaction is no longer active');
      expect(() => detached('owner', 'test.note', 'inside')).toThrow('Transaction is no longer active');
      await storage.transaction(tx => {
        expect(() => retained.records.put(put('during-another'))).toThrow('Transaction is no longer active');
        return tx.records.put(put('fresh'));
      });
      expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'outside'))).toBeUndefined();
      expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'during-another'))).toBeUndefined();
      expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'inside')) !== undefined).toBe(ending === 'commit');
      expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'fresh')?.revision)).toBe(1);
    } finally { await storage.close(); }
    expect(() => retained.records.get('owner', 'test.note', 'fresh')).toThrow('Transaction is no longer active');
  });

  it('rejects an unawaited blob write that resumes after its transaction ends', async () => {
    const storage = await open();
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    const spy = vi.spyOn(crypto.subtle, 'digest').mockImplementationOnce(async (...args) => { await held; return digest(...args); });
    let outcome!: Promise<unknown>;
    try {
      await storage.transaction(tx => {
        outcome = tx.blobs.put({ tenant: 'owner', bytes: new Uint8Array([1, 2, 3]), contentType: 'application/octet-stream', privacy: 'P0', now: Date.now() });
        return ok(undefined);
      });
      const assertion = expect(outcome).rejects.toThrow('Transaction is no longer active');
      release();
      await assertion;
      expect(await storage.transaction(tx => ok(tx.blobs.collectOrphans(Date.now() + 1000)))).toEqual(ok(0));
    } finally { release(); spy.mockRestore(); await storage.close(); }
  });

  it('keeps an awaited asynchronous read active only until its callback settles', async () => {
    const storage = await open();
    let retained!: Tx;
    try {
      await storage.transaction(tx => tx.records.put(put('existing')));
      const result = await storage.read(async tx => {
        retained = tx;
        await Promise.resolve();
        return tx.records.get('owner', 'test.note', 'existing');
      });
      expect(result?.revision).toBe(1);
      expect(() => retained.records.get('owner', 'test.note', 'existing')).toThrow('Transaction is no longer active');
    } finally { await storage.close(); }
  });
});

it('revokes transaction handles before an asynchronous durable commit and after failed persistence', async () => {
  let rejectCommit!: (error: Error) => void;
  let entered!: () => void;
  const ready = new Promise<void>(resolve => { entered = resolve; });
  const commit = new Promise<void>((_resolve, reject) => { rejectCommit = reject; });
  const storage = createStorage(createMemoryDriver({ persist: async () => { entered(); await commit; } }));
  let retained!: Tx;
  const write = storage.transaction(tx => { retained = tx; return tx.records.put(put('inside')); }).then(
    result => ({ result }), error => ({ error: error as Error }),
  );
  try {
    await ready;
    expect(() => retained.records.put(put('while-persisting'))).toThrow('Transaction is no longer active');
    rejectCommit(new Error('injected persistence failure'));
    expect(await write).toEqual({ error: new Error('injected persistence failure') });
    expect(() => retained.records.get('owner', 'test.note', 'inside')).toThrow('Transaction is no longer active');
    expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'inside'))).toBeUndefined();
    expect(await storage.read(tx => tx.records.get('owner', 'test.note', 'while-persisting'))).toBeUndefined();
  } finally { rejectCommit(new Error('cleanup')); await write; await storage.close(); }
});

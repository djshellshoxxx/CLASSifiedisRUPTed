import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { ok } from '../errors/result.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { createMemoryStorage, type Storage } from './storage.ts';

const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'close-boundary', indexedDB: new IDBFactory() })],
];

for (const [name, open] of adapters) describe(`${name} storage close boundary`, () => {
  it('drains earlier work but never runs reads or writes queued behind close', async () => {
    const storage = await open();
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    let ranBeforeClose = false;
    let ranAfterClose = false;
    const before = storage.transaction(async () => {
      await gate;
      ranBeforeClose = true;
      return ok('before');
    });
    const closing = storage.close();
    const after = storage.transaction(() => {
      ranAfterClose = true;
      return ok('after');
    });
    const read = storage.read(() => { ranAfterClose = true; });
    const outcomes = Promise.allSettled([before, closing, after, read]);
    release();
    const results = await outcomes;
    expect(results[0]).toEqual({ status: 'fulfilled', value: ok('before') });
    expect(results[1]?.status).toBe('fulfilled');
    for (const result of results.slice(2)) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') expect(result.reason).toEqual(new Error('storage is closed'));
    }
    expect(ranBeforeClose).toBe(true);
    expect(ranAfterClose).toBe(false);
    expect(await storage.ping()).toBe(false);
    await storage.close();
  });
});

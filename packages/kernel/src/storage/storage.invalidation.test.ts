import { describe, expect, it, vi } from 'vitest';
import { ok } from '../errors/result.ts';
import { createMemoryDriver } from './memory-driver.ts';
import { createStorage } from './storage.ts';
import type { Tx } from './tx.ts';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, deny) => { resolve = accept; reject = deny; });
  return { promise, resolve, reject };
}
const put = (id: string) => ({ tenant: 'owner', type: 'test.note', id, data: { text: id },
  idx: [null, null, null, null] as const, expectedRevision: 0, now: 1_800_000_000_000 });

describe('storage native invalidation boundary', () => {
  it('rejects a direct read-mode transaction invalidated between callback and public resolution', async () => {
    const invalidation = new AbortController();
    const storage = createStorage(createMemoryDriver(), { invalidation: invalidation.signal });
    const read = storage.transaction(() => {
      queueMicrotask(() => invalidation.abort('connection_closed'));
      return ok('captured private value');
    }, { mode: 'read' });
    await expect(read).rejects.toThrow('storage is invalidated');
    await storage.close();
  });

  it('revokes active handles and discards a delayed read without running queued callbacks', async () => {
    const invalidation = new AbortController(), entered = deferred(), resume = deferred();
    const close = vi.fn();
    const storage = createStorage(createMemoryDriver({ onClose: close }), { invalidation: invalidation.signal });
    await storage.transaction(tx => tx.records.put(put('saved')));
    let retained!: Tx;
    const read = storage.read(async tx => {
      retained = tx;
      const captured = tx.records.get('owner', 'test.note', 'saved');
      entered.resolve();
      await resume.promise;
      return captured;
    });
    await entered.promise;
    const queuedRead = vi.fn(), queuedWrite = vi.fn(() => ok(undefined));
    const outcomes = Promise.allSettled([read, storage.read(queuedRead), storage.transaction(queuedWrite)]);
    invalidation.abort('connection_closed');
    expect(() => retained.records.get('owner', 'test.note', 'saved')).toThrow('storage is invalidated');
    expect(() => storage.transaction(() => ok(undefined))).toThrow('storage is invalidated');
    expect(close).not.toHaveBeenCalled();
    const closing = storage.close();
    expect(storage.close()).toBe(closing);
    resume.resolve();
    for (const result of await outcomes) {
      expect(result).toEqual({ status: 'rejected', reason: new Error('storage is invalidated') });
    }
    await closing;
    expect(queuedRead).not.toHaveBeenCalled();
    expect(queuedWrite).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
    expect(await storage.ping()).toBe(false);
  });

  it('rolls back callback work invalidated before persistence starts', async () => {
    const invalidation = new AbortController(), entered = deferred(), resume = deferred();
    const persist = vi.fn(async () => {});
    const storage = createStorage(createMemoryDriver({ persist }), { invalidation: invalidation.signal });
    const write = storage.transaction(async tx => {
      const changed = tx.records.put(put('uncommitted'));
      entered.resolve();
      await resume.promise;
      return changed;
    });
    const outcome = Promise.allSettled([write]);
    await entered.promise;
    invalidation.abort('versionchange');
    resume.resolve();
    expect(await outcome).toEqual([{ status: 'rejected', reason: new Error('storage is invalidated') }]);
    expect(persist).not.toHaveBeenCalled();
    await storage.close();
  });

  it.each(['success', 'failure'] as const)('preserves terminal durable %s after invalidation and drains before close', async ending => {
    const invalidation = new AbortController(), entered = deferred(), terminal = deferred();
    const failure = new Error('durable transaction rejected');
    const closeFailure = new Error('driver close rejected');
    const persisted: string[] = [];
    const close = vi.fn(() => { if (ending === 'failure') throw closeFailure; });
    const storage = createStorage(createMemoryDriver({
      async persist(changes) {
        entered.resolve();
        await terminal.promise;
        persisted.push(...changes.map(change => change.key));
      }, onClose: close,
    }), { invalidation: invalidation.signal });
    const write = storage.transaction(tx => tx.records.put(put('committed')));
    const outcome = Promise.allSettled([write]);
    await entered.promise;
    invalidation.abort('versionchange');
    const closing = storage.close();
    expect(storage.close()).toBe(closing);
    expect(close).not.toHaveBeenCalled();
    if (ending === 'success') terminal.resolve(); else terminal.reject(failure);
    const [settled] = await outcome;
    if (ending === 'success') {
      expect(settled).toMatchObject({ status: 'fulfilled', value: { ok: true, value: { id: 'committed' } } });
      expect(persisted).toHaveLength(1);
    } else {
      expect(settled).toEqual({ status: 'rejected', reason: failure });
      expect(persisted).toEqual([]);
    }
    if (ending === 'success') await closing;
    else await expect(closing).rejects.toBe(closeFailure);
    expect(close).toHaveBeenCalledTimes(1);
    expect(await storage.ping()).toBe(false);
  });

  it('observes invalidation that happened before the working set was attached', async () => {
    const invalidation = new AbortController(); invalidation.abort('connection_closed');
    const driver = createMemoryDriver(), begin = vi.spyOn(driver, 'begin'), close = vi.spyOn(driver, 'close');
    const storage = createStorage(driver, { invalidation: invalidation.signal });
    expect(storage.invalidation).toBe(invalidation.signal);
    await expect(storage.read(() => 'private')).rejects.toThrow('storage is invalidated');
    expect(await storage.ping()).toBe(false);
    await storage.close();
    expect(begin).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });
});

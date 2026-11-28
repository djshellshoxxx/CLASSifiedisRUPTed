import { IDBFactory, forceCloseDatabase } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { openIndexedDbConnection, openIndexedDbStorage, VAULT_DB_VERSION, type VaultLocks } from './indexeddb.ts';
import { ok } from '../errors/result.ts';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
function trackedLocks(afterRelease?: () => Promise<void>) {
  const held = new Set<string>();
  let releases = 0;
  const locks: VaultLocks = {
    async request(name, _options, callback) {
      if (held.has(name)) return callback(null);
      held.add(name);
      try { return await callback({}); }
      finally { await afterRelease?.(); held.delete(name); releases++; }
    },
  };
  return { locks, held, releases: () => releases };
}
function observe(factory: IDBFactory, opened: (db: IDBDatabase) => void): IDBFactory {
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
/** Keep a real fake-indexeddb transaction active with ordinary queued reads.
 * The control changes scheduling, not the production function under test. */
function holdNextTransaction(db: IDBDatabase, mode: IDBTransactionMode) {
  const started = deferred<IDBTransaction>();
  const original = db.transaction.bind(db);
  let holding = true, selected = false;
  db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
    const tx = original(...args);
    if (!selected && args[1] === mode) {
      selected = true;
      const store = tx.objectStore(tx.objectStoreNames[0]!);
      const keepAlive = () => {
        if (!holding) return;
        const request = store.get('synthetic-keepalive');
        request.onsuccess = keepAlive;
      };
      keepAlive();
      started.resolve(tx);
    }
    return tx;
  };
  return { started: started.promise, release() { holding = false; db.transaction = original; } };
}
/** A genuine upgrade request emits versionchange. Aborting the upgrade preserves
 * the production schema version and existing data for an ordinary fresh reopen. */
function requestAbortedUpgrade(factory: IDBFactory, name: string): Promise<DOMException | null> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, VAULT_DB_VERSION + 1);
    request.onupgradeneeded = () => request.transaction!.abort();
    request.onerror = event => { event.preventDefault(); resolve(request.error); };
    request.onsuccess = () => { request.result.close(); reject(new Error('Fixture upgrade unexpectedly committed')); };
  });
}
const invalidated = (signal: AbortSignal): Promise<void> => signal.aborted ? Promise.resolve()
  : new Promise(resolve => signal.addEventListener('abort', () => resolve(), { once: true }));

describe('IndexedDB native connection invalidation', () => {
  it('revokes idle working-set reads and empty ping, then preserves data on an explicit reopen', async () => {
    const factory = new IDBFactory(), lease = trackedLocks();
    const name = 'idle-native-invalidation';
    const storage = await openIndexedDbStorage({ name, indexedDB: factory, locks: lease.locks });
    await storage.transaction(tx => tx.records.put({ tenant: 'owner', type: 'test.note', id: 'saved',
      data: { text: 'retained' }, idx: ['retained', null, null, null], expectedRevision: 0, now: 1_800_000_000_000 }));
    expect((await requestAbortedUpgrade(factory, name))?.name).toBe('AbortError');
    expect(storage.invalidation?.reason).toBe('versionchange');
    const read = vi.fn(() => 'stale'), write = vi.fn(() => ok(undefined));
    await expect(storage.read(read)).rejects.toThrow('storage is invalidated');
    expect(() => storage.transaction(write)).toThrow('storage is invalidated');
    expect(await storage.ping()).toBe(false);
    expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
    await storage.close();
    expect(lease.releases()).toBe(1);
    const reopened = await openIndexedDbStorage({ name, indexedDB: factory, locks: lease.locks });
    try {
      expect(await reopened.read(tx => tx.records.query({ tenant: 'owner', type: 'test.note',
        filters: [{ slot: 1, op: 'eq', value: 'retained' }], orderSlot: 0, dir: 'asc', limit: 10 })))
        .toMatchObject([{ id: 'saved', data: { text: 'retained' }, revision: 1 }]);
    } finally { await reopened.close(); }
  });

  it('rejects startup invalidated during the writer claim and holds the lease until it settles', async () => {
    const rawFactory = new IDBFactory(), lease = trackedLocks();
    const name = 'claim-native-invalidation', opened = deferred<IDBDatabase>();
    let held!: ReturnType<typeof holdNextTransaction>;
    const factory = observe(rawFactory, db => { held = holdNextTransaction(db, 'readwrite'); opened.resolve(db); });
    const opening = openIndexedDbConnection({ name, indexedDB: factory, locks: lease.locks });
    const outcome = Promise.allSettled([opening]);
    const db = await opened.promise;
    await held.started;
    const notified = new Promise<void>(resolve => db.addEventListener('versionchange', () => resolve(), { once: true }));
    const upgrade = requestAbortedUpgrade(rawFactory, name);
    await notified;
    expect(lease.releases()).toBe(0);
    await expect(openIndexedDbConnection({ name, indexedDB: rawFactory, locks: lease.locks }))
      .rejects.toMatchObject({ error: { code: 'DEPENDENCY_UNAVAILABLE', params: { reason: 'vault_locked' } } });
    held.release();
    expect(await outcome).toEqual([{ status: 'rejected', reason: new Error('Storage closed') }]);
    expect((await upgrade)?.name).toBe('AbortError');
    expect(lease.releases()).toBe(1);
    const fresh = await openIndexedDbConnection({ name, indexedDB: rawFactory, locks: lease.locks });
    await fresh.close();
  });

  it.each(['snapshot', 'persist'] as const)('drains a pending %s before releasing and preserves only durable success', async kind => {
    const factory = new IDBFactory(), releaseGate = deferred(), releaseStarted = deferred();
    let releaseCount = 0;
    const lease = trackedLocks(async () => { if (++releaseCount === 1) { releaseStarted.resolve(); await releaseGate.promise; } });
    const name = `pending-${kind}`, opened = deferred<IDBDatabase>();
    const connection = await openIndexedDbConnection({ name, indexedDB: observe(factory, db => opened.resolve(db)), locks: lease.locks });
    const db = await opened.promise;
    const held = holdNextTransaction(db, kind === 'snapshot' ? 'readonly' : 'readwrite');
    const pending = kind === 'snapshot' ? connection.snapshot()
      : connection.persist([{ table: 'meta', key: 'saved', row: { value: 7 } }]);
    const outcome = Promise.allSettled([pending]);
    await held.started;
    const upgrade = requestAbortedUpgrade(factory, name);
    await invalidated(connection.invalidation);
    const closing = connection.close();
    expect(connection.close()).toBe(closing);
    let closed = false; void closing.then(() => { closed = true; });
    expect(releaseCount).toBe(0);
    await expect(connection.snapshot()).rejects.toThrow('Storage closed');
    held.release();
    const [result] = await outcome;
    if (kind === 'snapshot') expect(result).toEqual({ status: 'rejected', reason: new Error('Storage closed') });
    else expect(result).toEqual({ status: 'fulfilled', value: undefined });
    await releaseStarted.promise;
    expect(closed).toBe(false);
    expect(lease.releases()).toBe(0);
    releaseGate.resolve();
    await closing;
    expect((await upgrade)?.name).toBe('AbortError');
    expect(lease.releases()).toBe(1);
    const fresh = await openIndexedDbConnection({ name, indexedDB: factory, locks: lease.locks });
    try { expect((await fresh.snapshot()).meta).toEqual(kind === 'persist' ? [['saved', { value: 7 }]] : []); }
    finally { await fresh.close(); }
  });

  it('observes abnormal native close once and exposes any release failure to every close caller', async () => {
    const factory = new IDBFactory(), opened = deferred<IDBDatabase>();
    const failure = new Error('lock-manager release failed');
    let releaseCount = 0;
    const lease = trackedLocks(async () => { releaseCount++; throw failure; });
    const connection = await openIndexedDbConnection({ name: 'abnormal-native-close',
      indexedDB: observe(factory, db => opened.resolve(db)), locks: lease.locks });
    const db = await opened.promise;
    const events = vi.fn(); connection.invalidation.addEventListener('abort', events);
    // This helper operates on an instance; fake-indexeddb 6.2.6 declares its
    // parameter as the constructor type instead.
    forceCloseDatabase(db as unknown as Parameters<typeof forceCloseDatabase>[0]);
    await invalidated(connection.invalidation);
    expect(connection.invalidation.reason).toBe('connection_closed');
    const closing = connection.close();
    expect(connection.close()).toBe(closing);
    await expect(closing).rejects.toBe(failure);
    await expect(connection.close()).rejects.toBe(failure);
    await expect(connection.snapshot()).rejects.toThrow('Storage closed');
    expect(events).toHaveBeenCalledTimes(1);
    expect(releaseCount).toBe(1);
  });
});

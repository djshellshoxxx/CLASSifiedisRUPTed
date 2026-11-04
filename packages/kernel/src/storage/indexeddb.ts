// Browser vault adapter (ADR-0016): the memory driver is the synchronous working set; each commit's
// change set is written in one IndexedDB readwrite transaction. A failed write restores the working set.
// One vault must be opened by one tab at a time (coordinate with Web Locks before opening).
import { createMemoryDriver, TABLES, type Change, type Snapshot, type TableName } from './memory-driver.ts';
import type { StorageDriver } from './driver.ts';
import { createStorage, type Storage } from './storage.ts';

export const VAULT_DB_VERSION = 1;

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('IndexedDB request failed'));
  });
}

function completion(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDb(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(name, VAULT_DB_VERSION);
    r.onupgradeneeded = () => {
      for (const t of TABLES) if (!r.result.objectStoreNames.contains(t)) r.result.createObjectStore(t);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('IndexedDB open failed'));
    r.onblocked = () => reject(new Error('IndexedDB open blocked by another connection'));
  });
}

async function loadSnapshot(db: IDBDatabase): Promise<Snapshot> {
  const tx = db.transaction([...TABLES], 'readonly');
  const snapshot: Partial<Record<TableName, Array<readonly [string, object]>>> = {};
  await Promise.all(
    TABLES.map(async (t) => {
      const store = tx.objectStore(t);
      const [keys, values] = await Promise.all([request(store.getAllKeys()), request(store.getAll())]);
      snapshot[t] = keys.map((k, i) => [String(k), values[i] as object] as const);
    }),
  );
  await completion(tx);
  return snapshot;
}

async function persist(db: IDBDatabase, changes: readonly Change[]): Promise<void> {
  const tables = [...new Set(changes.map((c) => c.table))];
  const tx = db.transaction(tables, 'readwrite');
  const done = completion(tx);
  for (const c of changes) {
    const store = tx.objectStore(c.table);
    if (c.row === undefined) store.delete(c.key);
    else store.put(c.row, c.key);
  }
  await done;
}

/** Driver over an open database and its loaded snapshot (exported for failure-injection tests). */
export function createIndexedDbDriver(db: IDBDatabase, snapshot: Snapshot): StorageDriver {
  return createMemoryDriver({ snapshot, kind: 'indexeddb', persist: (changes) => persist(db, changes), onClose: () => db.close() });
}

export interface IndexedDbOptions {
  /** Database name, one per vault principal, e.g. `classrup-vault:<principalId>`. */
  readonly name: string;
  /** Defaults to globalThis.indexedDB; tests pass fake-indexeddb's factory. */
  readonly indexedDB?: IDBFactory;
}

export async function openIndexedDbStorage(opts: IndexedDbOptions): Promise<Storage> {
  const factory = opts.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new Error('IndexedDB is not available');
  const db = await openDb(factory, opts.name);
  db.onversionchange = () => db.close();
  return createStorage(createIndexedDbDriver(db, await loadSnapshot(db)));
}

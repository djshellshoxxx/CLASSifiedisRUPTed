// Browser vault adapter (ADR-0016): the memory driver is the synchronous working set; each commit's
// change set is written in one IndexedDB readwrite transaction. A failed write restores the working set.
// Single writer per vault: the storage holds an exclusive Web Lock named after the database for its whole
// lifetime, so a second tab cannot open the same vault. As a fence for environments without Web Locks,
// open records a writer token and every commit re-reads it inside its readwrite transaction: once another
// connection has opened the vault, this one's commits abort and its working set is restored.
import { createSystemClock, type Clock } from '../clock/clock.ts';
import { appError, AppErrorException } from '../errors/app-error.ts';
import { webCryptoRandom, type RandomFill } from '../ids/uuidv7.ts';
import { bytesToBase64url } from './base64url.ts';
import { runRetentionSweep, type RetentionOptions } from './maintenance.ts';
import { createMemoryDriver, TABLES, type Change, type Snapshot, type TableName } from './memory-driver.ts';
import type { StorageDriver } from './driver.ts';
import { createStorage, type Storage } from './storage.ts';

export const VAULT_DB_VERSION = 1;
const WRITER_KEY = 'writer';

/** The part of the Web Locks API (navigator.locks) the vault uses. */
export interface VaultLocks {
  request(name: string, options: { readonly mode: 'exclusive'; readonly ifAvailable: true }, callback: (lock: object | null) => Promise<void>): Promise<unknown>;
}

function vaultBusy(reason: 'vault_locked' | 'vault_superseded'): AppErrorException {
  return new AppErrorException(appError('DEPENDENCY_UNAVAILABLE', { params: { dependency: 'storage', reason } }));
}

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
      const rows = keys.map((k, i) => [String(k), values[i] as object] as const);
      snapshot[t] = t === 'meta' ? rows.filter(([k]) => k !== WRITER_KEY) : rows;
    }),
  );
  await completion(tx);
  return snapshot;
}

/** Records this connection as the vault's writer; a connection opened earlier is fenced off from then on. */
async function claimWriter(db: IDBDatabase, token: string): Promise<void> {
  const tx = db.transaction(['meta'], 'readwrite');
  const done = completion(tx);
  tx.objectStore('meta').put({ token }, WRITER_KEY);
  await done;
}

async function persist(db: IDBDatabase, changes: readonly Change[], writer: string | undefined): Promise<void> {
  const tables = [...new Set<TableName>([...(writer === undefined ? [] : ['meta' as const]), ...changes.map((c) => c.table)])];
  const tx = db.transaction(tables, 'readwrite');
  const done = completion(tx);
  let superseded = false;
  const write = (): void => {
    for (const c of changes) {
      const store = tx.objectStore(c.table);
      if (c.row === undefined) store.delete(c.key);
      else store.put(c.row, c.key);
    }
  };
  if (writer === undefined) write();
  else {
    const check = tx.objectStore('meta').get(WRITER_KEY);
    check.onsuccess = () => {
      if ((check.result as { token?: unknown } | undefined)?.token === writer) return write();
      superseded = true;
      tx.abort();
    };
  }
  try {
    await done;
  } catch (e) {
    throw superseded ? vaultBusy('vault_superseded') : e;
  }
}

export interface IndexedDbDriverOptions {
  /** Writer token recorded by claimWriter; when set, every commit aborts unless it is still current. */
  readonly writer?: string;
  readonly onClose?: () => void;
}

/** Driver over an open database and its loaded snapshot (exported for failure-injection tests). */
export function createIndexedDbDriver(db: IDBDatabase, snapshot: Snapshot, opts: IndexedDbDriverOptions = {}): StorageDriver {
  return createMemoryDriver({
    snapshot,
    kind: 'indexeddb',
    persist: (changes) => persist(db, changes, opts.writer),
    onClose: () => {
      db.close();
      opts.onClose?.();
    },
  });
}

/** Resolves with a release function while the exclusive lock is held, or undefined when another holder has it. */
function acquireLock(locks: VaultLocks, name: string): Promise<(() => void) | undefined> {
  let release: () => void = () => undefined;
  const held = new Promise<void>((r) => {
    release = r;
  });
  return new Promise((resolve, reject) => {
    locks
      .request(name, { mode: 'exclusive', ifAvailable: true }, (lock) => {
        resolve(lock ? release : undefined);
        return lock ? held : Promise.resolve();
      })
      .catch(reject);
  });
}

export interface IndexedDbOptions {
  /** Database name, one per vault principal, e.g. `classrup-vault:<principalId>`. */
  readonly name: string;
  /** Defaults to globalThis.indexedDB; tests pass fake-indexeddb's factory. */
  readonly indexedDB?: IDBFactory;
  /** Web Locks manager; defaults to navigator.locks. Where none exists, only the writer fence applies. */
  readonly locks?: VaultLocks;
  /** Clock for the open-time retention sweep; defaults to the system clock. */
  readonly clock?: Clock;
  readonly retention?: RetentionOptions;
  /** Randomness for the writer token; defaults to WebCrypto. */
  readonly random?: RandomFill;
}

/**
 * Opens the vault: takes the vault lock (DEPENDENCY_UNAVAILABLE with reason vault_locked when another tab
 * holds it), loads the working set and runs the retention sweep (expired idempotency rows, old outbox
 * events and dead letters).
 */
export async function openIndexedDbStorage(opts: IndexedDbOptions): Promise<Storage> {
  const factory = opts.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new Error('IndexedDB is not available');
  const locks: VaultLocks | undefined = opts.locks ?? globalThis.navigator?.locks;
  const release = locks ? await acquireLock(locks, `classrup-storage:${opts.name}`) : () => undefined;
  if (!release) throw vaultBusy('vault_locked');
  let db: IDBDatabase | undefined;
  let storage: Storage | undefined;
  try {
    db = await openDb(factory, opts.name);
    const conn = db;
    conn.onversionchange = () => conn.close();
    const token = new Uint8Array(16);
    (opts.random ?? webCryptoRandom)(token);
    const writer = bytesToBase64url(token);
    await claimWriter(db, writer);
    storage = createStorage(createIndexedDbDriver(db, await loadSnapshot(db), { writer, onClose: release }));
    const swept = await runRetentionSweep(storage, opts.clock ?? createSystemClock(), opts.retention);
    if (!swept.ok) throw new AppErrorException(swept.error);
    return storage;
  } catch (e) {
    if (storage) await storage.close();
    else {
      db?.close();
      release();
    }
    throw e;
  }
}

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

// A request error can bubble to the transaction before the terminal abort.
// Only complete/abort establish that a transaction no longer owns its work.
function completion(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

// Observe terminal settlement before scheduling requests. If scheduling or
// reading fails, abort any already-enqueued work and drain the terminal event
// before returning the original error to the working-set rollback path.
async function withTransaction<T>(tx: IDBTransaction, work: () => T | Promise<T>): Promise<T> {
  const done = completion(tx);
  // The transaction can abort while work is still awaiting a request.
  void done.catch(() => undefined);
  let value: T;
  try {
    value = await work();
  } catch (error) {
    try { tx.abort(); } catch { /* already committing or finished */ }
    await done.catch(() => undefined);
    throw error;
  }
  await done;
  return value;
}

function openDb(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(name, VAULT_DB_VERSION);
    // Rejecting the caller does not cancel an IndexedDB open request. Once
    // abandoned it must neither upgrade the schema nor leak a late connection.
    let abandoned = false;
    r.onupgradeneeded = () => {
      if (abandoned) {
        r.transaction?.abort();
        return;
      }
      for (const t of TABLES) if (!r.result.objectStoreNames.contains(t)) r.result.createObjectStore(t);
    };
    r.onsuccess = () => {
      if (abandoned) {
        r.result.close();
        return;
      }
      resolve(r.result);
    };
    r.onerror = () => reject(r.error ?? new Error('IndexedDB open failed'));
    r.onblocked = () => {
      abandoned = true;
      reject(new Error('IndexedDB open blocked by another connection'));
    };
  });
}

async function loadSnapshot(db: IDBDatabase): Promise<Snapshot> {
  const tx = db.transaction([...TABLES], 'readonly');
  return withTransaction(tx, async () => {
    const snapshot: Partial<Record<TableName, Array<readonly [string, object]>>> = {};
    await Promise.all(
      TABLES.map(async (t) => {
        const store = tx.objectStore(t);
        // Create both requests before wrapping either in a promise: if the
        // second call throws synchronously there is no orphaned first promise.
        const keyRequest = store.getAllKeys();
        const valueRequest = store.getAll();
        const [keys, values] = await Promise.all([request(keyRequest), request(valueRequest)]);
        const rows = keys.map((k, i) => [String(k), values[i] as object] as const);
        snapshot[t] = t === 'meta' ? rows.filter(([k]) => k !== WRITER_KEY) : rows;
      }),
    );
    return snapshot;
  });
}

/** Records this connection as the vault's writer; a connection opened earlier is fenced off from then on. */
async function claimWriter(db: IDBDatabase, token: string): Promise<void> {
  const tx = db.transaction(['meta'], 'readwrite');
  await withTransaction(tx, () => {
    tx.objectStore('meta').put({ token }, WRITER_KEY);
  });
}

async function persist(db: IDBDatabase, changes: readonly Change[], writer: string | undefined): Promise<void> {
  const tables = [...new Set<TableName>([...(writer === undefined ? [] : ['meta' as const]), ...changes.map((c) => c.table)])];
  const tx = db.transaction(tables, 'readwrite');
  await withTransaction(tx, () => {
    const write = (): void => {
      for (const c of changes) {
        const store = tx.objectStore(c.table);
        if (c.row === undefined) store.delete(c.key);
        else store.put(c.row, c.key);
      }
    };
    if (writer === undefined) return write();
    // Keep the check and scheduling of writes in the same IDB success
    // callback, where the transaction is active on every supported browser.
    return new Promise<void>((resolve, reject) => {
      const check = tx.objectStore('meta').get(WRITER_KEY);
      check.onerror = () => reject(check.error ?? new Error('IndexedDB writer check failed'));
      check.onsuccess = () => {
        try {
          if ((check.result as { token?: unknown } | undefined)?.token !== writer) throw vaultBusy('vault_superseded');
          write();
          resolve();
        } catch (error) {
          // Do not let a synchronous scheduling failure escape the callback or
          // allow earlier queued writes to commit. withTransaction drains abort.
          try { tx.abort(); } catch { /* already aborted */ }
          reject(error);
        }
      };
    });
  });
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

/** A fenced connection; callers serialize snapshot/persist operations and own authentication. */
export interface IndexedDbConnection {
  snapshot(): Promise<Snapshot>;
  persist(changes: readonly Change[]): Promise<void>;
  close(): void;
}

/** Owns the writer fence while a higher layer authenticates and decodes its snapshot. */
export async function openIndexedDbConnection(opts: IndexedDbOptions): Promise<IndexedDbConnection> {
  const factory = opts.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new Error('IndexedDB is not available');
  const locks: VaultLocks | undefined = opts.locks ?? globalThis.navigator?.locks;
  const release = locks ? await acquireLock(locks, `classrup-storage:${opts.name}`) : () => undefined;
  if (!release) throw vaultBusy('vault_locked');
  let db: IDBDatabase | undefined;
  try {
    db = await openDb(factory, opts.name);
    const conn = db;
    conn.onversionchange = () => conn.close();
    const token = new Uint8Array(16);
    (opts.random ?? webCryptoRandom)(token);
    const writer = bytesToBase64url(token);
    await claimWriter(conn, writer);
    let closed = false;
    const check = (): void => { if (closed) throw new Error('Storage closed'); };
    return {
      async snapshot() { check(); return loadSnapshot(conn); },
      async persist(changes) { check(); await persist(conn, changes, writer); },
      close() { if (closed) return; closed = true; conn.close(); release(); },
    };
  } catch (error) { db?.close(); release(); throw error; }
}

/** Opens an unencrypted working set and runs retention; user vaults add protection in @classrup/vault. */
export async function openIndexedDbStorage(opts: IndexedDbOptions): Promise<Storage> {
  const connection = await openIndexedDbConnection(opts);
  let storage: Storage | undefined;
  try {
    storage = createStorage(createMemoryDriver({
      kind: 'indexeddb', snapshot: await connection.snapshot(),
      persist: changes => connection.persist(changes), onClose: () => connection.close(),
    }));
    const swept = await runRetentionSweep(storage, opts.clock ?? createSystemClock(), opts.retention);
    if (!swept.ok) throw new AppErrorException(swept.error);
    return storage;
  } catch (error) {
    if (storage) await storage.close(); else connection.close();
    throw error;
  }
}

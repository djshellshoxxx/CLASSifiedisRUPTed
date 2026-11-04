// Storage port: serialized unit-of-work transactions over a driver (single writer per vault or relay).
import type { Result } from '../errors/result.ts';
import { ok } from '../errors/result.ts';
import type { DriverKind, StorageDriver } from './driver.ts';
import { createMemoryDriver } from './memory-driver.ts';
import { createTx, type Tx } from './tx.ts';

export type TxMode = 'read' | 'write';

export interface Storage {
  readonly kind: DriverKind;
  /**
   * Runs fn in one transaction. Commits when fn returns ok (write mode), rolls back on err or
   * exception (rethrown). Transactions are serialized; do not call transaction() from inside fn.
   */
  transaction<T, E>(fn: (tx: Tx) => Result<T, E> | Promise<Result<T, E>>, opts?: { readonly mode?: TxMode }): Promise<Result<T, E>>;
  /** Read-only transaction; always rolled back. */
  read<T>(fn: (tx: Tx) => T | Promise<T>): Promise<T>;
  /** True when a write transaction can be opened and committed. */
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

function createLock(): <T>(fn: () => Promise<T>) => Promise<T> {
  let tail: Promise<void> = Promise.resolve();
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const prev = tail;
    let release: () => void = () => undefined;
    tail = new Promise<void>((r) => {
      release = r;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  };
}

async function runTx<T, E>(driver: StorageDriver, mode: TxMode, fn: (tx: Tx) => Result<T, E> | Promise<Result<T, E>>): Promise<Result<T, E>> {
  const tx = createTx(driver.begin(mode));
  let result: Result<T, E>;
  try {
    result = await fn(tx);
  } catch (e) {
    driver.rollback();
    throw e;
  }
  if (!result.ok || mode === 'read') {
    driver.rollback();
    return result;
  }
  await driver.commit();
  return result;
}

export function createStorage(driver: StorageDriver): Storage {
  const lock = createLock();
  let closed = false;
  const guard = (): void => {
    if (closed) throw new Error('storage is closed');
  };
  const storage: Storage = {
    kind: driver.kind,
    transaction: (fn, opts) => {
      guard();
      return lock(() => runTx(driver, opts?.mode ?? 'write', fn));
    },
    read: async <T>(fn: (tx: Tx) => T | Promise<T>): Promise<T> => {
      const r = await storage.transaction<T, never>(async (tx) => ok((await fn(tx)) as T), { mode: 'read' });
      if (!r.ok) throw new Error('read transaction failed');
      return r.value;
    },
    ping: async () => {
      try {
        return (await storage.transaction(() => ok(true))).ok;
      } catch {
        return false;
      }
    },
    close: () =>
      lock(async () => {
        if (closed) return;
        closed = true;
        await driver.close();
      }),
  };
  return storage;
}

/** In-memory adapter with the same semantics as the vault and relay adapters (tests, ephemeral use). */
export function createMemoryStorage(): Storage {
  return createStorage(createMemoryDriver());
}

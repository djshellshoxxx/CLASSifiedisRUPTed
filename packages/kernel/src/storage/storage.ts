// Storage port: serialized unit-of-work transactions over a driver (single writer per vault or relay).
import type { Result } from '../errors/result.ts';
import { ok } from '../errors/result.ts';
import type { DriverKind, StorageDriver } from './driver.ts';
import { createMemoryDriver } from './memory-driver.ts';
import { createTx, type Tx } from './tx.ts';

export type TxMode = 'read' | 'write';

export interface Storage {
  readonly kind: DriverKind;
  /** Native backing-store loss is terminal, including for cached reads and no-op writes. */
  readonly invalidation?: AbortSignal;
  /**
   * Runs fn in one transaction. Commits when fn returns ok (write mode), rolls back on err or
   * exception (rethrown). Transactions are serialized; do not call transaction() from inside fn.
   * Await all work inside fn. Synchronous callbacks are revoked before yielding; returned
   * promises are revoked when this wrapper observes their settlement, before commit/rollback.
   * Already queued microtasks can run before that observation, so the guard is not a substitute
   * for awaiting transaction work. Retained handles cannot access a later transaction or closed storage.
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

/** Both transaction ports consist of named stores containing methods. Bind every method so
 * destructuring cannot bypass the lifetime check, including methods added to either port later. */
function bindLifetime<T extends object>(stores: T, guard: () => void): T {
  return Object.fromEntries(Object.entries(stores).map(([name, methods]) => [name,
    Object.fromEntries(Object.entries(methods).map(([method, invoke]) => [method, (...args: unknown[]) => {
      guard();
      return Reflect.apply(invoke as (...input: unknown[]) => unknown, methods, args);
    }])),
  ])) as T;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
    && typeof (value as { then?: unknown }).then === 'function';
}

async function runTx<T, E>(driver: StorageDriver, mode: TxMode, fn: (tx: Tx) => Result<T, E> | Promise<Result<T, E>>,
  checkInvalidation: () => void): Promise<Result<T, E>> {
  let active = true;
  const guard = (): void => {
    if (!active) throw new Error('Transaction is no longer active');
    checkInvalidation();
  };
  // Guard the driver as well as the public port: an unawaited blob hash can resume
  // inside a public async method after the callback has already returned.
  const tx = bindLifetime(createTx(bindLifetime(driver.begin(mode), guard), driver.kind), guard);
  let result: Result<T, E>;
  try {
    const pending = fn(tx);
    // Do not yield to queued microtasks after a synchronous callback has returned.
    result = isThenable(pending) ? await pending : pending;
    // A handler can retain a detached value across an await. Revoke publication
    // as well as subsequent transaction methods when the backing store is lost.
    checkInvalidation();
  } catch (e) {
    active = false;
    driver.rollback();
    throw e;
  } finally {
    // Persistence may await encryption or IndexedDB. Callback access ends before it starts.
    active = false;
  }
  if (!result.ok || mode === 'read') {
    driver.rollback();
    return result;
  }
  await driver.commit();
  // A successful durable commit stays successful even if invalidation followed
  // its admission. Rejecting here would falsely report rollback to its caller.
  return result;
}

export function createStorage(driver: StorageDriver, options: { readonly invalidation?: AbortSignal } = {}): Storage {
  const { invalidation } = options;
  const lock = createLock();
  let closed = false;
  let closeSettlement: Promise<void> | undefined;
  const checkInvalidation = (): void => {
    if (invalidation?.aborted) throw new Error('storage is invalidated');
  };
  const guard = (): void => {
    checkInvalidation();
    if (closed) throw new Error('storage is closed');
  };
  const invalidate = (): void => { void storage.close().catch(() => undefined); };
  const storage: Storage = {
    kind: driver.kind,
    ...(invalidation ? { invalidation } : {}),
    transaction: (fn, opts) => {
      guard();
      const mode = opts?.mode ?? 'write';
      const result = lock(() => {
        // A previously queued close() may complete after the call-site guard.
        // Check again at execution time so no handler can run against a closed driver.
        guard();
        return runTx(driver, mode, fn, checkInvalidation);
      });
      // Native invalidation can run in a microtask after rollback but before the
      // serialized result reaches its caller. Reads must also pass this boundary.
      return mode === 'read' ? result.then(value => { checkInvalidation(); return value; }) : result;
    },
    read: async <T>(fn: (tx: Tx) => T | Promise<T>): Promise<T> => {
      const r = await storage.transaction<T, never>((tx) => {
        const pending = fn(tx);
        return isThenable(pending) ? Promise.resolve(pending).then(value => ok(value as T)) : ok(pending as T);
      }, { mode: 'read' });
      checkInvalidation();
      if (!r.ok) throw new Error('read transaction failed');
      return r.value;
    },
    ping: async () => {
      try {
        const result = await storage.transaction(() => ok(true));
        guard();
        return result.ok;
      } catch {
        return false;
      }
    },
    close: () => {
      // Keep the original queued drain and its outcome, including a rejection.
      if (closeSettlement) return closeSettlement;
      invalidation?.removeEventListener('abort', invalidate);
      closeSettlement = lock(async () => {
        closed = true;
        await driver.close();
      });
      return closeSettlement;
    },
  };
  invalidation?.addEventListener('abort', invalidate, { once: true });
  // A native event may precede composition of the decrypted working set.
  if (invalidation?.aborted) invalidate();
  return storage;
}

/** In-memory adapter with the same semantics as the vault and relay adapters (tests, ephemeral use). */
export function createMemoryStorage(): Storage {
  return createStorage(createMemoryDriver());
}

// Tenant-scoped views of a transaction handed to command, query and consumer handlers.
import type { Clock } from '../clock/clock.ts';
import type { AppError } from '../errors/app-error.ts';
import type { Result } from '../errors/result.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import { readRepo, writeRepo, type ReadRepo, type Repo, type RepoDef } from './repo.ts';
import type { Lease, SignedEnvelope, SyncEntry, Tx } from './tx.ts';

export interface ScopedLeases {
  acquire(resourceId: string, holder: string, ttlMs?: number): Result<Lease, AppError>;
  renew(resourceId: string, holder: string, ttlMs?: number): Result<Lease, AppError>;
  release(resourceId: string, holder: string): Result<void, AppError>;
  get(resourceId: string): Lease | undefined;
}

export interface ScopedSync {
  /** Queues a signed statement for one destination (state prepared); only for deliveryEligible definitions. */
  enqueue(destination: string, envelope: SignedEnvelope): SyncEntry;
  get(id: string): SyncEntry | undefined;
  list(q?: { readonly destination?: string; readonly ref?: string; readonly limit?: number }): SyncEntry[];
  /** Records a verified signed peer acknowledgement for the statement `ref` sent to `destination`. */
  recordPeerAck(destination: string, ref: string, ack: unknown): Result<SyncEntry, AppError>;
  /** User retry of a failed entry (failed -> prepared). */
  retry(id: string): Result<SyncEntry, AppError>;
}

export interface ReadScope {
  repo<T, K extends string>(def: RepoDef<T, K>): ReadRepo<T, K>;
}

export interface WriteScope {
  repo<T, K extends string>(def: RepoDef<T, K>): Repo<T, K>;
  readonly leases: ScopedLeases;
  readonly sync: ScopedSync;
}

export interface ScopeOptions {
  readonly tx: Tx;
  readonly tenantId: string;
  readonly clock: Clock;
  readonly ids: IdGen;
  /** False unless the running definition is deliveryEligible; enqueue then throws (programmer error). */
  readonly deliveryEligible: boolean;
}

export function readScope(o: Pick<ScopeOptions, 'tx' | 'tenantId' | 'clock'>): ReadScope {
  const s = { tx: o.tx, tenantId: o.tenantId, now: () => o.clock.now() };
  return { repo: (def) => readRepo(s, def) };
}

function scopedLeases(o: ScopeOptions): ScopedLeases {
  const base = (resourceId: string, holder: string) => ({ tenant: o.tenantId, resourceId, holder, now: o.clock.now() });
  return {
    acquire: (resourceId, holder, ttlMs) => o.tx.leases.acquire({ ...base(resourceId, holder), ...(ttlMs === undefined ? {} : { ttlMs }) }),
    renew: (resourceId, holder, ttlMs) => o.tx.leases.renew({ ...base(resourceId, holder), ...(ttlMs === undefined ? {} : { ttlMs }) }),
    release: (resourceId, holder) => o.tx.leases.release(base(resourceId, holder)),
    get: (resourceId) => o.tx.leases.get(o.tenantId, resourceId, o.clock.now()),
  };
}

export function recordPeerAck(tx: Tx, tenantId: string, destination: string, ref: string, ack: unknown, now: number): Result<SyncEntry, AppError> {
  const entries = tx.sync.list({ tenant: tenantId, destination, ref, limit: 1 });
  const entry = entries[0];
  return tx.sync.transition(entry ? entry.id : '', 'peer_ack', { receipt: { peerAck: ack }, nextAttemptAt: null }, now);
}

function scopedSync(o: ScopeOptions): ScopedSync {
  const own = (id: string) => {
    const e = o.tx.sync.get(id);
    return e && e.tenantId === o.tenantId ? e : undefined;
  };
  return {
    enqueue: (destination, envelope) => {
      if (!o.deliveryEligible) throw new Error('sync.enqueue: definition is not deliveryEligible');
      return o.tx.sync.enqueue({ id: o.ids.next(), tenant: o.tenantId, destination, envelope, now: o.clock.now() });
    },
    get: own,
    list: (q = {}) => o.tx.sync.list({ ...q, tenant: o.tenantId }),
    recordPeerAck: (destination, ref, ack) => recordPeerAck(o.tx, o.tenantId, destination, ref, ack, o.clock.now()),
    retry: (id) => o.tx.sync.transition(own(id)?.id ?? '', 'retry', { attempts: 0, nextAttemptAt: null, lastError: null }, o.clock.now()),
  };
}

export function writeScope(o: ScopeOptions): WriteScope {
  const s = { tx: o.tx, tenantId: o.tenantId, now: () => o.clock.now() };
  return { repo: (def) => writeRepo(s, def), leases: scopedLeases(o), sync: scopedSync(o) };
}

// In-memory driver: the reference semantics for every adapter, with an undo journal for rollback.
// The IndexedDB vault adapter reuses it as its working set and persists each commit's change set.
import { compareUtf8 } from '../hash/canonical.ts';
import type {
  BlobRow,
  DeadLetterRow,
  DriverTx,
  IdempotencyRow,
  InboxRow,
  LeaseRow,
  MigrationRow,
  OutboxRow,
  PendingQuery,
  RecordFilter,
  RecordQuery,
  RecordRow,
  StorageDriver,
  SyncListQuery,
  SyncRow,
} from './driver.ts';

export const TABLES = ['records', 'outbox', 'inbox', 'idempotency', 'leases', 'dead_letter', 'sync_outbox', 'blobs', 'blob_refs', 'schema_migrations', 'meta'] as const;
export type TableName = (typeof TABLES)[number];

type Row = object;
export interface Change {
  readonly table: TableName;
  readonly key: string;
  readonly row: Row | undefined;
}
export type Snapshot = Partial<Record<TableName, ReadonlyArray<readonly [string, Row]>>>;

interface BlobRefRow {
  readonly tenant: string;
  readonly ref: string;
  readonly holder: string;
}

const SEP = '\u0001';
const k = (...parts: readonly string[]): string => parts.join(SEP);

function groupOf(table: TableName, row: Row): string | undefined {
  if (table === 'records') return k((row as RecordRow).tenant, (row as RecordRow).type);
  if (table === 'inbox') return (row as InboxRow).consumer;
  if (table === 'blob_refs') return k((row as BlobRefRow).tenant, (row as BlobRefRow).ref);
  return undefined;
}

interface Journal {
  readonly undo: Array<{ table: TableName; key: string; before: Row | undefined }>;
}

class MemoryState {
  readonly tables = new Map<TableName, Map<string, Row>>(TABLES.map((t) => [t, new Map()]));
  readonly groups = new Map<string, Set<string>>();

  table<R extends Row>(name: TableName): Map<string, R> {
    return this.tables.get(name) as Map<string, R>;
  }

  write(table: TableName, key: string, row: Row | undefined): void {
    const map = this.table(table);
    const prior = map.get(key);
    if (prior) this.ungroup(table, key, prior);
    if (row === undefined) map.delete(key);
    else {
      map.set(key, row);
      const g = groupOf(table, row);
      if (g !== undefined) this.groupSet(table, g).add(key);
    }
  }

  groupKeys(table: TableName, group: string): ReadonlySet<string> {
    return this.groups.get(k(table, group)) ?? new Set();
  }

  private groupSet(table: TableName, group: string): Set<string> {
    const id = k(table, group);
    let set = this.groups.get(id);
    if (!set) this.groups.set(id, (set = new Set()));
    return set;
  }

  private ungroup(table: TableName, key: string, row: Row): void {
    const g = groupOf(table, row);
    if (g !== undefined) this.groups.get(k(table, g))?.delete(key);
  }
}

function cmp(a: string, b: string): number {
  return compareUtf8(a, b);
}

function filterMatches(v: string | null, f: RecordFilter): boolean {
  if (v === null) return false;
  const c = cmp(v, f.value);
  switch (f.op) {
    case 'eq':
      return c === 0;
    case 'lt':
      return c < 0;
    case 'lte':
      return c <= 0;
    case 'gt':
      return c > 0;
    case 'gte':
      return c >= 0;
  }
}

function orderValue(r: RecordRow, slot: RecordQuery['orderSlot']): string | null {
  return slot === 0 ? r.id : r.idx[slot - 1] ?? null;
}

function compareRows(a: RecordRow, b: RecordRow, q: RecordQuery): number {
  const sign = q.dir === 'asc' ? 1 : -1;
  if (q.orderSlot !== 0) {
    const c = cmp(orderValue(a, q.orderSlot) ?? '', orderValue(b, q.orderSlot) ?? '');
    if (c !== 0) return sign * c;
  }
  return sign * cmp(a.id, b.id);
}

function isAfter(r: RecordRow, q: RecordQuery): boolean {
  const after = q.after;
  if (!after) return true;
  const sign = q.dir === 'asc' ? 1 : -1;
  if (q.orderSlot !== 0) {
    const c = cmp(orderValue(r, q.orderSlot) ?? '', after.value ?? '');
    if (c !== 0) return sign * c > 0;
  }
  return sign * cmp(r.id, after.id) > 0;
}

function bySeq(a: OutboxRow, b: OutboxRow): number {
  return a.seq - b.seq;
}

function byCreated(a: SyncRow, b: SyncRow): number {
  return cmp(a.createdAt, b.createdAt) || cmp(a.id, b.id);
}

function makeTx(state: MemoryState, journal: Journal | null): DriverTx {
  const write = (table: TableName, key: string, row: Row | undefined): void => {
    if (!journal) throw new Error('write in a read transaction');
    journal.undo.push({ table, key, before: state.table(table).get(key) });
    state.write(table, key, row);
  };
  const recs = () => state.table<RecordRow>('records');
  const inbox = () => state.table<InboxRow>('inbox');
  const outbox = () => state.table<OutboxRow>('outbox');
  const sync = () => state.table<SyncRow>('sync_outbox');

  const inboxRowsFor = (consumer: string): InboxRow[] => [...state.groupKeys('inbox', consumer)].map((key) => inbox().get(key) as InboxRow);

  return {
    records: {
      get: (tenant, type, id) => recs().get(k(tenant, type, id)),
      upsert: (row) => write('records', k(row.tenant, row.type, row.id), row),
      remove: (tenant, type, id) => write('records', k(tenant, type, id), undefined),
      query: (q) => {
        const rows = [...state.groupKeys('records', k(q.tenant, q.type))].map((key) => recs().get(key) as RecordRow);
        return rows
          .filter((r) => q.filters.every((f) => filterMatches(r.idx[f.slot - 1] ?? null, f)))
          .filter((r) => q.orderSlot === 0 || r.idx[q.orderSlot - 1] !== null)
          .filter((r) => isAfter(r, q))
          .sort((a, b) => compareRows(a, b, q))
          .slice(0, q.limit);
      },
    },
    outbox: {
      append: (row) => {
        const meta = state.table<{ value: number }>('meta');
        const seq = (meta.get('outbox_seq')?.value ?? 0) + 1;
        write('meta', 'outbox_seq', { value: seq });
        write('outbox', row.eventId, { ...row, seq });
        return seq;
      },
      get: (eventId) => outbox().get(eventId),
      pending: (q: PendingQuery) => {
        const types = new Set(q.types);
        const mine = new Map(inboxRowsFor(q.consumer).map((r) => [r.eventId, r]));
        const blocked = new Set([...mine.values()].filter((r) => r.status === 'retry' && cmp(r.nextAttemptAt ?? '', q.now) > 0).map((r) => r.aggregateId));
        return [...outbox().values()]
          .filter((o) => types.has(o.type) && !blocked.has(o.aggregateId))
          .filter((o) => {
            const i = mine.get(o.eventId);
            return !i || (i.status === 'retry' && cmp(i.nextAttemptAt ?? '', q.now) <= 0);
          })
          .sort(bySeq)
          .slice(0, q.limit);
      },
      oldestUndelivered: (consumer, types) => {
        const set = new Set(types);
        return [...outbox().values()]
          .filter((o) => set.has(o.type))
          .filter((o) => {
            const i = inbox().get(k(consumer, o.eventId));
            return !i || i.status === 'retry';
          })
          .sort(bySeq)[0];
      },
      purgeBefore: (occurredAt) => {
        const old = [...outbox().values()].filter((o) => cmp(o.occurredAt, occurredAt) < 0);
        if (old.length === 0) return 0;
        const held = new Set([...state.table<DeadLetterRow>('dead_letter').values()].map((d) => d.eventId));
        const purge = new Set(old.filter((o) => !held.has(o.eventId)).map((o) => o.eventId));
        for (const [key, row] of [...inbox().entries()]) if (purge.has(row.eventId)) write('inbox', key, undefined);
        for (const eventId of purge) write('outbox', eventId, undefined);
        return purge.size;
      },
    },
    inbox: {
      get: (consumer, eventId) => inbox().get(k(consumer, eventId)),
      upsert: (row) => write('inbox', k(row.consumer, row.eventId), row),
    },
    idempotency: {
      get: (tenant, actor, command, key) => state.table<IdempotencyRow>('idempotency').get(k(tenant, actor, command, key)),
      upsert: (row) => write('idempotency', k(row.tenant, row.actor, row.command, row.key), row),
      purgeExpired: (now) => {
        const all = [...state.table<IdempotencyRow>('idempotency').entries()].filter(([, r]) => cmp(r.expiresAt, now) <= 0);
        for (const [key] of all) write('idempotency', key, undefined);
        return all.length;
      },
    },
    leases: {
      get: (tenant, resourceId) => state.table<LeaseRow>('leases').get(k(tenant, resourceId)),
      upsert: (row) => write('leases', k(row.tenant, row.resourceId), row),
    },
    deadLetters: {
      get: (consumer, eventId) => state.table<DeadLetterRow>('dead_letter').get(k(consumer, eventId)),
      upsert: (row) => write('dead_letter', k(row.consumer, row.eventId), row),
      remove: (consumer, eventId) => write('dead_letter', k(consumer, eventId), undefined),
      list: (consumer, limit) =>
        [...state.table<DeadLetterRow>('dead_letter').values()]
          .filter((d) => consumer === undefined || d.consumer === consumer)
          .sort((a, b) => cmp(a.deadAt, b.deadAt) || cmp(a.consumer, b.consumer) || cmp(a.eventId, b.eventId))
          .slice(0, limit),
      purgeBefore: (deadAt) => {
        const old = [...state.table<DeadLetterRow>('dead_letter').entries()].filter(([, d]) => cmp(d.deadAt, deadAt) < 0);
        for (const [key] of old) write('dead_letter', key, undefined);
        return old.length;
      },
    },
    sync: {
      get: (id) => sync().get(id),
      upsert: (row) => write('sync_outbox', row.id, row),
      heads: (now, limit) => {
        const heads = new Map<string, SyncRow>();
        for (const r of [...sync().values()].filter((s) => s.state === 'prepared').sort(byCreated)) {
          const dest = k(r.tenant, r.destination);
          if (!heads.has(dest)) heads.set(dest, r);
        }
        return [...heads.values()].filter((r) => r.nextAttemptAt === null || cmp(r.nextAttemptAt, now) <= 0).sort(byCreated).slice(0, limit);
      },
      list: (q: SyncListQuery) =>
        [...sync().values()]
          .filter((r) => (q.tenant === undefined || r.tenant === q.tenant) && (q.destination === undefined || r.destination === q.destination))
          .filter((r) => (q.state === undefined || r.state === q.state) && (q.ref === undefined || r.ref === q.ref))
          .sort(byCreated)
          .slice(0, q.limit),
    },
    blobs: {
      get: (tenant, ref) => {
        const b = state.table<BlobRow>('blobs').get(k(tenant, ref));
        return b ? { ...b, bytes: b.bytes.slice() } : undefined;
      },
      upsert: (row) => write('blobs', k(row.tenant, row.ref), { ...row, bytes: row.bytes.slice() }),
      remove: (tenant, ref) => write('blobs', k(tenant, ref), undefined),
      holders: (tenant, ref) => state.groupKeys('blob_refs', k(tenant, ref)).size,
      attach: (tenant, ref, holder) => write('blob_refs', k(tenant, ref, holder), { tenant, ref, holder }),
      detach: (tenant, ref, holder) => write('blob_refs', k(tenant, ref, holder), undefined),
      orphans: (createdBefore, limit) =>
        [...state.table<BlobRow>('blobs').values()]
          .filter((b) => cmp(b.createdAt, createdBefore) < 0 && state.groupKeys('blob_refs', k(b.tenant, b.ref)).size === 0)
          .sort((a, b) => cmp(a.createdAt, b.createdAt) || cmp(a.tenant, b.tenant) || cmp(a.ref, b.ref))
          .slice(0, limit)
          .map((b) => ({ tenant: b.tenant, ref: b.ref, encrypted: b.encrypted })),
    },
    migrations: {
      list: () => [...state.table<MigrationRow>('schema_migrations').values()].sort((a, b) => cmp(a.appliedAt, b.appliedAt) || cmp(a.id, b.id)),
      insert: (row) => write('schema_migrations', row.id, row),
    },
  };
}

export interface MemoryDriverOptions {
  readonly snapshot?: Snapshot;
  /** Persists a committed change set; on rejection the working set is restored and the error rethrown. */
  readonly persist?: (changes: readonly Change[]) => Promise<void>;
  readonly kind?: 'memory' | 'indexeddb';
  readonly onClose?: () => void;
}

function loadSnapshot(state: MemoryState, snapshot: Snapshot | undefined): void {
  for (const t of TABLES) for (const [key, row] of snapshot?.[t] ?? []) state.write(t, key, row);
}

function changesOf(state: MemoryState, journal: Journal): Change[] {
  const seen = new Map<string, Change>();
  for (const u of journal.undo) seen.set(k(u.table, u.key), { table: u.table, key: u.key, row: state.table(u.table).get(u.key) });
  return [...seen.values()];
}

function undo(state: MemoryState, journal: Journal): void {
  for (let i = journal.undo.length - 1; i >= 0; i--) {
    const u = journal.undo[i];
    if (u) state.write(u.table, u.key, u.before);
  }
}

export function createMemoryDriver(opts: MemoryDriverOptions = {}): StorageDriver {
  const state = new MemoryState();
  loadSnapshot(state, opts.snapshot);
  let journal: Journal | null = null;
  return {
    kind: opts.kind ?? 'memory',
    begin: (mode) => {
      journal = mode === 'write' ? { undo: [] } : null;
      return makeTx(state, journal);
    },
    commit: async () => {
      const j = journal;
      journal = null;
      if (!j || !opts.persist || j.undo.length === 0) return;
      try {
        await opts.persist(changesOf(state, j));
      } catch (e) {
        undo(state, j);
        throw e;
      }
    },
    rollback: () => {
      if (journal) undo(state, journal);
      journal = null;
    },
    close: () => opts.onClose?.(),
  };
}

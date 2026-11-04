// Relay SQLite adapter (node:sqlite DatabaseSync): WAL, busy_timeout, BEGIN IMMEDIATE (CTR-SCH-001). Node-only.
import { createHash } from 'node:crypto';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { appError, AppErrorException } from '../errors/app-error.ts';
import type {
  DeadLetterRow,
  DriverTx,
  IdempotencyRow,
  InboxRow,
  IndexSlot,
  LeaseRow,
  MigrationRow,
  OutboxRow,
  RecordQuery,
  RecordRow,
  StorageDriver,
  SyncRow,
} from './driver.ts';
import { KERNEL_SQL_MIGRATIONS, SCHEMA_MIGRATIONS_DDL, type SqlMigration } from './sqlite-schema.ts';
import { createStorage, type Storage } from './storage.ts';

type SqlRow = Record<string, SQLInputValue>;
const OPS = { eq: '=', lt: '<', lte: '<=', gt: '>', gte: '>=' } as const;
const SQLITE_BUSY = 5;
const SQLITE_LOCKED = 6;

const s = (v: SQLInputValue | undefined): string => String(v);
const sn = (v: SQLInputValue | undefined): string | null => (v === null || v === undefined ? null : String(v));
const n = (v: SQLInputValue | undefined): number => Number(v);
const col = (slot: IndexSlot): string => `idx${slot}`;

function toRecord(r: SqlRow): RecordRow {
  return { tenant: s(r['tenant']), type: s(r['type']), id: s(r['id']), revision: n(r['revision']), data: s(r['data']), idx: [sn(r['idx1']), sn(r['idx2']), sn(r['idx3']), sn(r['idx4'])], createdAt: s(r['created_at']), updatedAt: s(r['updated_at']) };
}
function toOutbox(r: SqlRow): OutboxRow {
  return { seq: n(r['seq']), eventId: s(r['event_id']), tenant: s(r['tenant']), type: s(r['type']), aggregateType: s(r['aggregate_type']), aggregateId: s(r['aggregate_id']), revision: n(r['revision']), occurredAt: s(r['occurred_at']), envelope: s(r['envelope']) };
}
function toInbox(r: SqlRow): InboxRow {
  return { consumer: s(r['consumer']), eventId: s(r['event_id']), aggregateId: s(r['aggregate_id']), status: s(r['status']) as InboxRow['status'], attempts: n(r['attempts']), nextAttemptAt: sn(r['next_attempt_at']), lastError: sn(r['last_error']), updatedAt: s(r['updated_at']) };
}
function toIdem(r: SqlRow): IdempotencyRow {
  return { tenant: s(r['tenant']), actor: s(r['actor']), command: s(r['command']), key: s(r['key']), requestHash: s(r['request_hash']), status: n(r['status']), response: s(r['response']), createdAt: s(r['created_at']), expiresAt: s(r['expires_at']) };
}
function toLease(r: SqlRow): LeaseRow {
  return { tenant: s(r['tenant']), resourceId: s(r['resource_id']), holder: s(r['holder']), expiresAt: s(r['expires_at']), acquiredAt: s(r['acquired_at']), fence: n(r['fence']) };
}
function toDead(r: SqlRow): DeadLetterRow {
  return { consumer: s(r['consumer']), eventId: s(r['event_id']), tenant: s(r['tenant']), type: s(r['type']), envelope: s(r['envelope']), attempts: n(r['attempts']), errorCode: s(r['error_code']), deadAt: s(r['dead_at']) };
}
function toSync(r: SqlRow): SyncRow {
  return { id: s(r['id']), tenant: s(r['tenant']), destination: s(r['destination']), ref: s(r['ref']), envelope: s(r['envelope']), state: s(r['state']) as SyncRow['state'], attempts: n(r['attempts']), nextAttemptAt: sn(r['next_attempt_at']), lastError: sn(r['last_error']), receipt: sn(r['receipt']), createdAt: s(r['created_at']), updatedAt: s(r['updated_at']) };
}
function toMigration(r: SqlRow): MigrationRow {
  return { id: s(r['id']), checksum: s(r['checksum']), appliedAt: s(r['applied_at']) };
}

function recordQuerySql(q: RecordQuery): { sql: string; params: SQLInputValue[] } {
  const params: SQLInputValue[] = [q.tenant, q.type];
  let sql = 'SELECT * FROM records WHERE tenant = ? AND type = ?';
  for (const f of q.filters) {
    sql += ` AND ${col(f.slot)} ${OPS[f.op]} ?`;
    params.push(f.value);
  }
  const order = q.orderSlot === 0 ? 'id' : col(q.orderSlot);
  if (q.orderSlot !== 0) sql += ` AND ${order} IS NOT NULL`;
  const cmp = q.dir === 'asc' ? '>' : '<';
  if (q.after && q.orderSlot === 0) {
    sql += ` AND id ${cmp} ?`;
    params.push(q.after.id);
  } else if (q.after) {
    sql += ` AND (${order} ${cmp} ? OR (${order} = ? AND id ${cmp} ?))`;
    params.push(q.after.value, q.after.value, q.after.id);
  }
  const dir = q.dir === 'asc' ? 'ASC' : 'DESC';
  sql += q.orderSlot === 0 ? ` ORDER BY id ${dir}` : ` ORDER BY ${order} ${dir}, id ${dir}`;
  sql += ' LIMIT ?';
  params.push(q.limit);
  return { sql, params };
}

function inList(values: readonly string[]): string {
  return values.map(() => '?').join(', ') || 'NULL';
}

function makeTx(stmt: (sql: string) => StatementSync, all: (sql: string, params: SQLInputValue[]) => SqlRow[]): DriverTx {
  const one = (sql: string, ...p: SQLInputValue[]): SqlRow | undefined => stmt(sql).get(...p) as SqlRow | undefined;
  const run = (sql: string, ...p: SQLInputValue[]) => stmt(sql).run(...p);
  return {
    records: {
      get: (t, ty, id) => {
        const r = one('SELECT * FROM records WHERE tenant = ? AND type = ? AND id = ?', t, ty, id);
        return r ? toRecord(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO records (tenant, type, id, revision, data, idx1, idx2, idx3, idx4, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', r.tenant, r.type, r.id, r.revision, r.data, r.idx[0], r.idx[1], r.idx[2], r.idx[3], r.createdAt, r.updatedAt),
      remove: (t, ty, id) => void run('DELETE FROM records WHERE tenant = ? AND type = ? AND id = ?', t, ty, id),
      query: (q) => {
        const { sql, params } = recordQuerySql(q);
        return all(sql, params).map(toRecord);
      },
    },
    outbox: {
      append: (r) => Number(run('INSERT INTO outbox (event_id, tenant, type, aggregate_type, aggregate_id, revision, occurred_at, envelope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', r.eventId, r.tenant, r.type, r.aggregateType, r.aggregateId, r.revision, r.occurredAt, r.envelope).lastInsertRowid),
      get: (eventId) => {
        const r = one('SELECT * FROM outbox WHERE event_id = ?', eventId);
        return r ? toOutbox(r) : undefined;
      },
      pending: (q) =>
        all(
          `SELECT o.* FROM outbox o LEFT JOIN inbox i ON i.consumer = ? AND i.event_id = o.event_id
           WHERE o.type IN (${inList(q.types)}) AND (i.event_id IS NULL OR (i.status = 'retry' AND i.next_attempt_at <= ?))
           AND o.aggregate_id NOT IN (SELECT b.aggregate_id FROM inbox b WHERE b.consumer = ? AND b.status = 'retry' AND b.next_attempt_at > ?)
           ORDER BY o.seq LIMIT ?`,
          [q.consumer, ...q.types, q.now, q.consumer, q.now, q.limit],
        ).map(toOutbox),
      oldestUndelivered: (consumer, types) => {
        const rows = all(`SELECT o.* FROM outbox o LEFT JOIN inbox i ON i.consumer = ? AND i.event_id = o.event_id WHERE o.type IN (${inList(types)}) AND (i.event_id IS NULL OR i.status = 'retry') ORDER BY o.seq LIMIT 1`, [consumer, ...types]);
        return rows[0] ? toOutbox(rows[0]) : undefined;
      },
      purgeBefore: (at) => Number(run('DELETE FROM outbox WHERE occurred_at < ?', at).changes),
    },
    inbox: {
      get: (c, e) => {
        const r = one('SELECT * FROM inbox WHERE consumer = ? AND event_id = ?', c, e);
        return r ? toInbox(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO inbox (consumer, event_id, aggregate_id, status, attempts, next_attempt_at, last_error, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', r.consumer, r.eventId, r.aggregateId, r.status, r.attempts, r.nextAttemptAt, r.lastError, r.updatedAt),
    },
    idempotency: {
      get: (t, a, c, k) => {
        const r = one('SELECT * FROM idempotency WHERE tenant = ? AND actor = ? AND command = ? AND key = ?', t, a, c, k);
        return r ? toIdem(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO idempotency (tenant, actor, command, key, request_hash, status, response, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', r.tenant, r.actor, r.command, r.key, r.requestHash, r.status, r.response, r.createdAt, r.expiresAt),
      purgeExpired: (now) => Number(run('DELETE FROM idempotency WHERE expires_at <= ?', now).changes),
    },
    leases: {
      get: (t, id) => {
        const r = one('SELECT * FROM leases WHERE tenant = ? AND resource_id = ?', t, id);
        return r ? toLease(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO leases (tenant, resource_id, holder, expires_at, acquired_at, fence) VALUES (?, ?, ?, ?, ?, ?)', r.tenant, r.resourceId, r.holder, r.expiresAt, r.acquiredAt, r.fence),
    },
    deadLetters: {
      get: (c, e) => {
        const r = one('SELECT * FROM dead_letter WHERE consumer = ? AND event_id = ?', c, e);
        return r ? toDead(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO dead_letter (consumer, event_id, tenant, type, envelope, attempts, error_code, dead_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', r.consumer, r.eventId, r.tenant, r.type, r.envelope, r.attempts, r.errorCode, r.deadAt),
      remove: (c, e) => void run('DELETE FROM dead_letter WHERE consumer = ? AND event_id = ?', c, e),
      list: (consumer, limit) =>
        (consumer === undefined
          ? all('SELECT * FROM dead_letter ORDER BY dead_at, consumer, event_id LIMIT ?', [limit])
          : all('SELECT * FROM dead_letter WHERE consumer = ? ORDER BY dead_at, consumer, event_id LIMIT ?', [consumer, limit])
        ).map(toDead),
    },
    sync: {
      get: (id) => {
        const r = one('SELECT * FROM sync_outbox WHERE id = ?', id);
        return r ? toSync(r) : undefined;
      },
      upsert: (r) => void run('INSERT OR REPLACE INTO sync_outbox (id, tenant, destination, ref, envelope, state, attempts, next_attempt_at, last_error, receipt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', r.id, r.tenant, r.destination, r.ref, r.envelope, r.state, r.attempts, r.nextAttemptAt, r.lastError, r.receipt, r.createdAt, r.updatedAt),
      heads: (now, limit) =>
        all(
          `SELECT s.* FROM sync_outbox s WHERE s.state = 'prepared' AND NOT EXISTS (
             SELECT 1 FROM sync_outbox p WHERE p.tenant = s.tenant AND p.destination = s.destination AND p.state = 'prepared'
             AND (p.created_at < s.created_at OR (p.created_at = s.created_at AND p.id < s.id)))
           AND (s.next_attempt_at IS NULL OR s.next_attempt_at <= ?) ORDER BY s.created_at, s.id LIMIT ?`,
          [now, limit],
        ).map(toSync),
      list: (q) => {
        const where: string[] = [];
        const params: SQLInputValue[] = [];
        for (const [c, v] of [['tenant', q.tenant], ['destination', q.destination], ['state', q.state], ['ref', q.ref]] as const) {
          if (v === undefined) continue;
          where.push(`${c} = ?`);
          params.push(v);
        }
        const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
        return all(`SELECT * FROM sync_outbox${clause} ORDER BY created_at, id LIMIT ?`, [...params, q.limit]).map(toSync);
      },
    },
    migrations: {
      list: () => all('SELECT * FROM schema_migrations ORDER BY applied_at, id', []).map(toMigration),
      insert: (r) => void run('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)', r.id, r.checksum, r.appliedAt),
    },
  };
}

function isBusy(e: unknown): boolean {
  const code = (e as { errcode?: unknown }).errcode;
  return code === SQLITE_BUSY || code === SQLITE_LOCKED;
}

function guardBusy<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (isBusy(e)) throw new AppErrorException(appError('DEPENDENCY_UNAVAILABLE', { params: { dependency: 'storage' } }));
    throw e;
  }
}

export function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

function applyKernelMigrations(db: DatabaseSync, list: readonly SqlMigration[]): void {
  db.exec(SCHEMA_MIGRATIONS_DDL);
  const applied = new Map((db.prepare('SELECT id, checksum FROM schema_migrations').all() as SqlRow[]).map((r) => [s(r['id']), s(r['checksum'])]));
  for (const m of list) {
    const sum = checksum(m.sql);
    const prior = applied.get(m.id);
    if (prior !== undefined && prior !== sum) throw new AppErrorException(appError('PLATFORM_STORE_MIGRATION_DRIFT', { params: { migration: m.id } }));
    if (prior !== undefined) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)').run(m.id, sum, new Date().toISOString());
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
}

export interface SqliteOptions {
  /** File path, or `:memory:` for tests. */
  readonly path: string;
  readonly busyTimeoutMs?: number;
  /** Extra forward-only SQL migrations (relay-only tables); kernel migrations always run first. */
  readonly migrations?: readonly SqlMigration[];
}

export interface SqliteStorage extends Storage {
  pragmas(): { readonly journalMode: string; readonly busyTimeoutMs: number };
}

function createSqliteDriver(db: DatabaseSync): StorageDriver {
  const cache = new Map<string, StatementSync>();
  const stmt = (sql: string): StatementSync => {
    let p = cache.get(sql);
    if (!p) cache.set(sql, (p = db.prepare(sql)));
    return p;
  };
  const all = (sql: string, params: SQLInputValue[]): SqlRow[] => stmt(sql).all(...params) as SqlRow[];
  let open = false;
  return {
    kind: 'sqlite',
    begin: (mode) => {
      guardBusy(() => db.exec(mode === 'write' ? 'BEGIN IMMEDIATE' : 'BEGIN DEFERRED'));
      open = true;
      return makeTx(stmt, all);
    },
    commit: () => {
      try {
        guardBusy(() => db.exec('COMMIT'));
        open = false;
      } catch (e) {
        if (db.isTransaction) db.exec('ROLLBACK');
        open = false;
        throw e;
      }
    },
    rollback: () => {
      if (open && db.isTransaction) db.exec('ROLLBACK');
      open = false;
    },
    close: () => db.close(),
  };
}

/** Opens the relay database, applies kernel migrations and returns a Storage. */
export function openSqliteStorage(opts: SqliteOptions): SqliteStorage {
  const db = new DatabaseSync(opts.path);
  const busy = opts.busyTimeoutMs ?? 5000;
  db.exec(`PRAGMA busy_timeout = ${Math.trunc(busy)}`);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA foreign_keys = ON');
  applyKernelMigrations(db, [...KERNEL_SQL_MIGRATIONS, ...(opts.migrations ?? [])]);
  const storage = createStorage(createSqliteDriver(db));
  return {
    ...storage,
    pragmas: () => {
      const jm = db.prepare('PRAGMA journal_mode').get() as SqlRow;
      const bt = db.prepare('PRAGMA busy_timeout').get() as SqlRow;
      return { journalMode: s(Object.values(jm)[0]), busyTimeoutMs: n(Object.values(bt)[0]) };
    },
  };
}

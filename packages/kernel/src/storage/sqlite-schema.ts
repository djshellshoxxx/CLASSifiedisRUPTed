// Relay SQLite schema (kernel migrations, forward-only, recorded in schema_migrations; CTR-SCH-001 SCH-5).
export interface SqlMigration {
  readonly id: string;
  readonly sql: string;
}

export const SCHEMA_MIGRATIONS_DDL = 'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) WITHOUT ROWID;';

export const KERNEL_SQL_MIGRATIONS: readonly SqlMigration[] = [
  {
    id: 'kernel:0001_base',
    sql: `
CREATE TABLE records (
  tenant TEXT NOT NULL, type TEXT NOT NULL, id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1), data TEXT NOT NULL,
  idx1 TEXT, idx2 TEXT, idx3 TEXT, idx4 TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant, type, id)) WITHOUT ROWID;
CREATE INDEX records_idx1 ON records(tenant, type, idx1, id);
CREATE INDEX records_idx2 ON records(tenant, type, idx2, id);
CREATE INDEX records_idx3 ON records(tenant, type, idx3, id);
CREATE INDEX records_idx4 ON records(tenant, type, idx4, id);
CREATE TABLE outbox (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, tenant TEXT NOT NULL,
  type TEXT NOT NULL, aggregate_type TEXT NOT NULL, aggregate_id TEXT NOT NULL,
  revision INTEGER NOT NULL, occurred_at TEXT NOT NULL, envelope TEXT NOT NULL);
CREATE INDEX outbox_type_seq ON outbox(type, seq);
CREATE INDEX outbox_occurred ON outbox(occurred_at);
CREATE TABLE inbox (
  consumer TEXT NOT NULL, event_id TEXT NOT NULL, aggregate_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'retry', 'dead')), attempts INTEGER NOT NULL,
  next_attempt_at TEXT, last_error TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY (consumer, event_id)) WITHOUT ROWID;
CREATE INDEX inbox_blocked ON inbox(consumer, status, next_attempt_at);
CREATE TABLE idempotency (
  tenant TEXT NOT NULL, actor TEXT NOT NULL, command TEXT NOT NULL, key TEXT NOT NULL,
  request_hash TEXT NOT NULL, status INTEGER NOT NULL, response TEXT NOT NULL,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY (tenant, actor, command, key)) WITHOUT ROWID;
CREATE INDEX idempotency_expiry ON idempotency(expires_at);
CREATE TABLE leases (
  tenant TEXT NOT NULL, resource_id TEXT NOT NULL, holder TEXT NOT NULL,
  expires_at TEXT NOT NULL, acquired_at TEXT NOT NULL, fence INTEGER NOT NULL,
  PRIMARY KEY (tenant, resource_id)) WITHOUT ROWID;
CREATE TABLE dead_letter (
  consumer TEXT NOT NULL, event_id TEXT NOT NULL, tenant TEXT NOT NULL, type TEXT NOT NULL,
  envelope TEXT NOT NULL, attempts INTEGER NOT NULL, error_code TEXT NOT NULL, dead_at TEXT NOT NULL,
  PRIMARY KEY (consumer, event_id)) WITHOUT ROWID;
CREATE TABLE sync_outbox (
  id TEXT PRIMARY KEY, tenant TEXT NOT NULL, destination TEXT NOT NULL, ref TEXT NOT NULL,
  envelope TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('prepared', 'transport_acknowledged', 'peer_accepted', 'failed')),
  attempts INTEGER NOT NULL, next_attempt_at TEXT, last_error TEXT, receipt TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL) WITHOUT ROWID;
CREATE INDEX sync_outbox_queue ON sync_outbox(tenant, destination, state, created_at, id);
CREATE INDEX sync_outbox_ref ON sync_outbox(ref);
`,
  },
];

// Row model and driver port shared by the memory, IndexedDB (vault) and SQLite (relay) adapters (CTR-SCH-001).
export type IndexSlot = 1 | 2 | 3 | 4;
export type IndexValues = readonly [string | null, string | null, string | null, string | null];

export interface RecordRow {
  readonly tenant: string;
  readonly type: string;
  readonly id: string;
  readonly revision: number;
  /** JSON text; every adapter stores and returns identical text. */
  readonly data: string;
  readonly idx: IndexValues;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type FilterOp = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';

export interface RecordFilter {
  readonly slot: IndexSlot;
  readonly op: FilterOp;
  readonly value: string;
}

export interface RecordQuery {
  readonly tenant: string;
  readonly type: string;
  readonly filters: readonly RecordFilter[];
  /** 0 orders by id; 1..4 orders by that index (rows with a null index value are excluded), then id. */
  readonly orderSlot: 0 | IndexSlot;
  readonly dir: 'asc' | 'desc';
  readonly after?: { readonly value: string | null; readonly id: string };
  readonly limit: number;
}

export interface OutboxRow {
  readonly seq: number;
  readonly eventId: string;
  readonly tenant: string;
  readonly type: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly envelope: string;
}

export type InboxStatus = 'done' | 'retry' | 'dead';

export interface InboxRow {
  readonly consumer: string;
  readonly eventId: string;
  readonly aggregateId: string;
  readonly status: InboxStatus;
  readonly attempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly updatedAt: string;
}

export interface PendingQuery {
  readonly consumer: string;
  readonly types: readonly string[];
  readonly now: string;
  readonly limit: number;
}

export interface IdempotencyRow {
  readonly tenant: string;
  readonly actor: string;
  readonly command: string;
  readonly key: string;
  readonly requestHash: string;
  readonly status: number;
  readonly response: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface LeaseRow {
  readonly tenant: string;
  readonly resourceId: string;
  readonly holder: string;
  readonly expiresAt: string;
  readonly acquiredAt: string;
  readonly fence: number;
}

export interface DeadLetterRow {
  readonly consumer: string;
  readonly eventId: string;
  readonly tenant: string;
  readonly type: string;
  readonly envelope: string;
  readonly attempts: number;
  readonly errorCode: string;
  readonly deadAt: string;
}

export type SyncState = 'prepared' | 'transport_acknowledged' | 'peer_accepted' | 'failed';

export interface SyncRow {
  readonly id: string;
  readonly tenant: string;
  readonly destination: string;
  readonly ref: string;
  readonly envelope: string;
  readonly state: SyncState;
  readonly attempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly receipt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SyncListQuery {
  readonly tenant?: string;
  readonly destination?: string;
  readonly state?: SyncState;
  readonly ref?: string;
  readonly limit: number;
}

export interface MigrationRow {
  readonly id: string;
  readonly checksum: string;
  readonly appliedAt: string;
}

/** Synchronous row operations inside one open transaction. */
export interface DriverTx {
  readonly records: {
    get(tenant: string, type: string, id: string): RecordRow | undefined;
    upsert(row: RecordRow): void;
    remove(tenant: string, type: string, id: string): void;
    query(q: RecordQuery): RecordRow[];
  };
  readonly outbox: {
    append(row: Omit<OutboxRow, 'seq'>): number;
    get(eventId: string): OutboxRow | undefined;
    /** Undelivered events for a consumer, ordered by seq, skipping aggregates blocked by a not-yet-due retry. */
    pending(q: PendingQuery): OutboxRow[];
    /** Oldest event of the given types without a done/dead inbox row for the consumer. */
    oldestUndelivered(consumer: string, types: readonly string[]): OutboxRow | undefined;
    purgeBefore(occurredAt: string): number;
  };
  readonly inbox: {
    get(consumer: string, eventId: string): InboxRow | undefined;
    upsert(row: InboxRow): void;
  };
  readonly idempotency: {
    get(tenant: string, actor: string, command: string, key: string): IdempotencyRow | undefined;
    upsert(row: IdempotencyRow): void;
    purgeExpired(now: string): number;
  };
  readonly leases: {
    get(tenant: string, resourceId: string): LeaseRow | undefined;
    upsert(row: LeaseRow): void;
  };
  readonly deadLetters: {
    get(consumer: string, eventId: string): DeadLetterRow | undefined;
    upsert(row: DeadLetterRow): void;
    remove(consumer: string, eventId: string): void;
    list(consumer: string | undefined, limit: number): DeadLetterRow[];
  };
  readonly sync: {
    get(id: string): SyncRow | undefined;
    upsert(row: SyncRow): void;
    /** Per destination, the oldest prepared entry, if its nextAttemptAt is null or <= now. */
    heads(now: string, limit: number): SyncRow[];
    list(q: SyncListQuery): SyncRow[];
  };
  readonly migrations: {
    list(): MigrationRow[];
    insert(row: MigrationRow): void;
  };
}

export type DriverKind = 'memory' | 'indexeddb' | 'sqlite';

/** Adapter contract. The storage wrapper serializes begin/commit/rollback; drivers need no locking. */
export interface StorageDriver {
  readonly kind: DriverKind;
  begin(mode: 'read' | 'write'): DriverTx;
  commit(): void | Promise<void>;
  rollback(): void;
  close(): void | Promise<void>;
}

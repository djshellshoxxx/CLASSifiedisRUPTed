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
  /** Times the replay primitive requeued this event; kept across requeue and re-dead-lettering. */
  readonly replayCount: number;
  readonly lastReplayedAt: string | null;
}

export interface DeadLetterListQuery {
  readonly consumer?: string;
  readonly tenant?: string;
  readonly limit: number;
}

export type BlobPrivacy = 'P0' | 'P1' | 'P2' | 'P3';

export interface BlobRow {
  readonly tenant: string;
  /** `blob:sha256-<base64url>` of the stored bytes. */
  readonly ref: string;
  readonly bytes: Uint8Array;
  readonly size: number;
  readonly contentType: string;
  readonly privacy: BlobPrivacy;
  readonly encrypted: boolean;
  readonly createdAt: string;
}

export type BlobMeta = Omit<BlobRow, 'bytes'> & {
  /** False when the ciphertext of an encrypted blob is absent from the separate store (relay restore or power loss). */
  readonly bytesPresent: boolean;
};

/**
 * Where an adapter keeps ciphertext of encrypted blobs: `inline` in the blobs store (memory, IndexedDB),
 * `separate` in the relay's attached blobs_enc database, or `unavailable` when that store is not attached.
 */
export type EncryptedBlobStore = 'inline' | 'separate' | 'unavailable';

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
    /**
     * Deletes events that occurred before the cutoff together with every consumer's inbox row for them;
     * events still held by a dead letter are kept until that dead letter is purged. Returns events deleted.
     */
    purgeBefore(occurredAt: string): number;
    /** Deletes one event with every consumer's inbox row for it. */
    remove(eventId: string): void;
  };
  readonly inbox: {
    get(consumer: string, eventId: string): InboxRow | undefined;
    upsert(row: InboxRow): void;
    remove(consumer: string, eventId: string): void;
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
    /** Ordered by deadAt, consumer, eventId. */
    list(q: DeadLetterListQuery): DeadLetterRow[];
    /** Dead letters whose inbox row is retry (requeued and not yet delivered or dead again), ordered like list. */
    requeued(q: DeadLetterListQuery): DeadLetterRow[];
    /** Dead letters with deadAt before the cutoff whose event is not currently requeued, ordered like list. */
    purgeable(deadAt: string, limit: number, tenant?: string): DeadLetterRow[];
    /** Number of dead letters (any consumer) holding the event. */
    countFor(eventId: string): number;
  };
  readonly blobs: {
    readonly encryptedStore: EncryptedBlobStore;
    /** Metadata and bytes; bytes is null when an encrypted blob's ciphertext is absent from the separate store. */
    get(tenant: string, ref: string): (BlobMeta & { readonly bytes: Uint8Array | null }) | undefined;
    /** Metadata without reading bytes. */
    meta(tenant: string, ref: string): BlobMeta | undefined;
    /** Writes the metadata row and the bytes (ciphertext to the separate store when encrypted and separate). */
    upsert(row: BlobRow): void;
    setPrivacy(tenant: string, ref: string, privacy: BlobPrivacy): void;
    /** Deletes the metadata row and its ciphertext row in the same transaction. */
    remove(tenant: string, ref: string): void;
    /** Number of holder rows (referencing records) for the ref. */
    holders(tenant: string, ref: string): number;
    attach(tenant: string, ref: string, holder: string): void;
    detach(tenant: string, ref: string, holder: string): void;
    /** Refs of stored blobs without holders created before the cutoff, oldest first (no bytes read). */
    orphans(createdBefore: string, limit: number): { tenant: string; ref: string; encrypted: boolean }[];
    /** Ciphertext rows of the separate store without a metadata row (power loss between the two file commits). */
    orphanCiphertext(limit: number): { tenant: string; ref: string }[];
    removeCiphertext(tenant: string, ref: string): void;
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

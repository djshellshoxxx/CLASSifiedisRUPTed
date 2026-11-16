# PS-119-01 — Domain schema: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-01.R01** A StoredRecord holds the key (tenantId, type, id), a revision starting at 1 and incremented by exactly 1 per accepted write, JSON data, up to four indexed text values and createdAt and updatedAt timestamps.
- **PS-119-01.R02** An OutboxEvent stores the CTR-EVT-001 envelope with a strictly increasing sequence, and an InboxEntry records the delivery status, attempts and next attempt time per (consumer, eventId).
- **PS-119-01.R03** The memory, IndexedDB and SQLite adapters share one row model so data round-trips identically, including JSON normalization and UTF-8 binary ordering of index values.
- **PS-119-01.R04** A MediaBlob is stored by content address blob:sha256-<base64url> with size, content type, privacy class and encryption flag, and its holders are the records that reference it.

## Specification

### StoredRecord

Schema `classrup.platform.stored_record/v1` · storage **relay+device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| tenantId | uuidv7 — vault ID in the vault, relay tenant on a relay |
| type | string — <slug>.<entity> declared by defineRepo |
| id | string — record ID, UUIDv7 for domain records |
| revision | int — starts at 1, +1 per accepted write (ID-4) |
| data | json — owning module's schema; class and retention set by that module |
| idx1? | string — first declared index value |
| idx2? | string — second declared index value |
| idx3? | string — third declared index value |
| idx4? | string — fourth declared index value |
| createdAt | timestamp — RFC 3339 UTC, kept across updates and restores |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one row per (tenantId, type, id).
- A write with expectedRevision n succeeds only when the stored revision is n (0 means absent) and stores n + 1.
- Index slots follow declaration order and are never reordered for an existing type.

### OutboxEvent

Schema `classrup.platform.outbox_event/v1` · storage **relay+device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| seq | int — strictly increasing per vault or relay |
| eventId | uuidv7 — envelope eventId, unique |
| tenantId | uuidv7 — envelope tenant |
| type | string — <slug>.<entity>.<past_tense_verb> |
| aggregateType | string — envelope aggregate.type |
| aggregateId | string — envelope aggregate.id |
| revision | int — aggregate revision |
| occurredAt | timestamp — envelope occurredAt |
| envelope | json — full CTR-EVT-001 envelope |

**Invariants**
- Written in the same transaction as the state change it describes (EVT-2, EVT-8).
- Never leaves the device or relay by itself; cross-party facts travel as signed statements in the sync outbox (EVT-9).

### InboxEntry

Schema `classrup.platform.inbox_entry/v1` · storage **relay+device** · privacy **P1** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| consumer | string — subscriber name <slug>.<consumer> |
| eventId | uuidv7 — delivered event |
| aggregateId | string — used to hold back later events of the same aggregate |
| status | enum — done \| retry \| dead |
| attempts | int — failed or successful handler runs |
| nextAttemptAt? | timestamp — set while status is retry |
| lastError? | string — error code only |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one row per (consumer, eventId); a done or dead row makes redelivery a no-op.
- status done is written in the same transaction as the consumer's side effects.

### MediaBlob

Schema `classrup.platform.media_blob/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| tenantId | uuidv7 — vault or relay tenant |
| ref | string — blob:sha256-<base64url of SHA-256 of bytes> |
| bytes | bytes — metadata stripped by F10.S02.M03; ciphertext when encrypted |
| size | int — ≤ 5 242 880 bytes |
| contentType | string — lowercase type/subtype |
| privacy | enum — P0 \| P1 \| P2 \| P3; a relay accepts P0 plaintext or ciphertext only |
| encrypted | boolean — true for P2 media encrypted by F08 before upload |
| createdAt | timestamp — RFC 3339 UTC |
| holders | set — record holders <type>/<id> in blob_refs |

**Invariants**
- The ref equals the SHA-256 content address of the stored bytes; identical bytes are stored once per tenant.
- The blob is deleted in the transaction that removes its last holder; an encrypted blob deletion reports shred so the owner deletes the per-object key.
- Storing identical bytes with a more public class lowers the stored class; it is never raised implicitly.

### Storage DDL

```sql
CREATE TABLE records (tenant TEXT NOT NULL, type TEXT NOT NULL, id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1), data TEXT NOT NULL,
  idx1 TEXT, idx2 TEXT, idx3 TEXT, idx4 TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant, type, id)) WITHOUT ROWID;
CREATE INDEX records_idx1 ON records(tenant, type, idx1, id);  -- likewise idx2..idx4
CREATE TABLE outbox (seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, tenant TEXT NOT NULL,
  type TEXT NOT NULL, aggregate_type TEXT NOT NULL, aggregate_id TEXT NOT NULL, revision INTEGER NOT NULL,
  occurred_at TEXT NOT NULL, envelope TEXT NOT NULL);
CREATE TABLE inbox (consumer TEXT NOT NULL, event_id TEXT NOT NULL, aggregate_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done','retry','dead')), attempts INTEGER NOT NULL,
  next_attempt_at TEXT, last_error TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (consumer, event_id)) WITHOUT ROWID;
CREATE TABLE leases (tenant TEXT NOT NULL, resource_id TEXT NOT NULL, holder TEXT NOT NULL, expires_at TEXT NOT NULL,
  acquired_at TEXT NOT NULL, fence INTEGER NOT NULL, PRIMARY KEY (tenant, resource_id)) WITHOUT ROWID;
CREATE TABLE dead_letter (consumer TEXT NOT NULL, event_id TEXT NOT NULL, tenant TEXT NOT NULL, type TEXT NOT NULL,
  envelope TEXT NOT NULL, attempts INTEGER NOT NULL, error_code TEXT NOT NULL, dead_at TEXT NOT NULL,
  PRIMARY KEY (consumer, event_id)) WITHOUT ROWID;
CREATE TABLE sync_outbox (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, destination TEXT NOT NULL, ref TEXT NOT NULL,
  envelope TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('prepared','transport_acknowledged','peer_accepted','failed')),
  attempts INTEGER NOT NULL, next_attempt_at TEXT, last_error TEXT, receipt TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE blobs (tenant TEXT NOT NULL, ref TEXT NOT NULL, bytes BLOB NOT NULL, size INTEGER NOT NULL CHECK (size <= 5242880),
  content_type TEXT NOT NULL, privacy TEXT NOT NULL, encrypted INTEGER NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (tenant, ref)) WITHOUT ROWID;
CREATE TABLE blob_refs (tenant TEXT NOT NULL, ref TEXT NOT NULL, holder TEXT NOT NULL, PRIMARY KEY (tenant, ref, holder)) WITHOUT ROWID;
CREATE TABLE schema_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) WITHOUT ROWID;
-- idempotency table: see F15.S02.M02. IndexedDB uses one object store per table with the same row shapes.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T01 | contract | PS-119-01.R01, PS-119-01.R03, PS-119-02.R01, PS-119-02.R02, PS-119-04.R02, PS-119-09.R01 | create, duplicate create, stale update, remove, equality, range, ordered and cursor queries on memory, SQLite and IndexedDB | identical results; CONFLICT_REVISION with currentRevision; NOT_FOUND; VALIDATION_FAILED for bad cursor or limit |
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).

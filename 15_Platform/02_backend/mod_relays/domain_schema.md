# PS-118-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R04, R05, R10), CTR-EVT-001 (R05, R12), CTR-ID-001, CTR-PRV-001 (R03, R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-01.R01 | Relay persists one `relay_queue_item` per (target peer, origin_node, event_id). Duplicate enqueue is a no-op. | MVP |
| PS-118-01.R02 | `envelope_bytes` is opaque: ≤ 64 KiB (CTR-EVT-001 R12), stored unparsed after signature verification. | MVP |
| PS-118-01.R03 | Queue rows hold node-level and pseudonymous references only: no client IP, no coordinates, no account names. | MVP |
| PS-118-01.R04 | Each row carries `expires_at` = `enqueued_at` + 7 days (ASSUMPTION). | MVP |

## Data / schema
```sql
CREATE TABLE relay_queue_item (
  queue_item_id   CHAR(30)    PRIMARY KEY,          -- ulid-class; prefix 'rqi_' PENDING CTR-ID-001 registration
  target_peer     CHAR(30)    NOT NULL,             -- fpr_
  origin_node     CHAR(30)    NOT NULL,             -- nod_
  event_id        CHAR(30)    NOT NULL,             -- evt_
  batch_ref       CHAR(30)    NULL,                 -- dlv_
  envelope_bytes  BYTEA       NOT NULL CHECK (octet_length(envelope_bytes) <= 65536),
  envelope_digest CHAR(64)    NOT NULL,             -- SHA-256
  state           VARCHAR(16) NOT NULL CHECK (state IN ('QUEUED','IN_FLIGHT','ACKED','REJECTED','EXPIRED')),
  attempts        SMALLINT    NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL,
  enqueued_at     TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  UNIQUE (target_peer, origin_node, event_id)
);
```
Peer link state is owned by CTR-FED-001 peer records (`trusted`, `restricted`, and related states); relay reads it, never writes it.

## Commands / queries / events
- Internal commands: `relay.enqueue`, `relay.forward`, `relay.ack`, `relay.expire` (see PS-118-04).
- Events: `relay_queue_item.dropped` (reason code only) and `relay_queue_item.expired`.

## States & transitions
Defined in PS-118-03. Terminal states: ACKED, REJECTED, EXPIRED.

## Validation & errors
Schema validation per PS-118-02. `envelope_bytes` is never returned to any client; only peers and the relay service read it.

## Authorization
Table writes by relay `sys_` principal only. Reads: `ope_` with `relay.read` for diagnostics, returning digests and counts, never bytes.

## Failure, idempotency, concurrency, offline
Unique key is the idempotency guard. Row update of `state` uses compare-and-set on `attempts` and `state`.

## Privacy, retention, abuse
Field classes: `envelope_bytes` payload class is the class of its content (CTR-EVT-001 R11); relay treats it as opaque and assumes at most PSEUDONYMOUS. `target_peer` and `origin_node` are node-level identifiers. Retention 7 days queued; terminal rows purged after 30 days (ASSUMPTION).

## Observability & budgets
Gauge `relay_queue_rows{state}`; alert at 80% of configured cap.

## Tests
- TEST-PS-118-01-01 (integration): duplicate enqueue leaves one row.
- TEST-PS-118-01-02 (unit): 64 KiB + 1 byte rejected at insert.
- TEST-PS-118-01-03 (schema scan): no column stores IP, coordinates or names.

## Acceptance criteria
1. Schema matches SQL above (after PENDING prefix registration).
2. No query path returns `envelope_bytes` to a client principal.
3. Purge job removes expired rows within 1 h of `expires_at`.

## Assumptions & open decisions
- PENDING CTR-ID-001 prefix for `rqi_` queue items (not in registry).
- ASSUMPTION: 7-day queue TTL, 30-day terminal retention.
- D01 PROVISIONAL (default: versioned signed envelopes with explicit opt-in; unapproved): envelope format.

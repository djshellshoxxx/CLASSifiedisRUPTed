# PS-023-01 — Domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-01.R01 | A lock reserves one item for one cycle version. At most one HELD lock per `item_id` at any time. | MVP |
| PS-023-01.R02 | A lock set is per (`cycle_id`, `proposal_version`) and contains 2–16 item locks (2 per party, max 8 parties; D02 PROVISIONAL). | MVP |
| PS-023-01.R03 | Each item lock has a monotonic `fence` integer per `item_id`, used to reject stale holders. | MVP |
| PS-023-01.R04 | `expires_at` default 24 h after HELD, one extension allowed, total ≤ 48 h (ASSUMPTION). | MVP |
| PS-023-01.R05 | Item availability counts are owned by F01.S03.M01 mod_availability and referenced by full ID; this module never edits them. | MVP |

## Data / schema
```sql
CREATE TABLE item_lock (
  lock_id        TEXT PRIMARY KEY,                -- lck_<ULID26> (ASSUMPTION: prefix pending CTR-ID-001)
  cycle_id       TEXT NOT NULL,                   -- cyc_<ULID26>
  proposal_version INTEGER NOT NULL CHECK (proposal_version >= 1),
  item_id        TEXT NOT NULL,                   -- listing item ID, owner F01
  owner_party_id TEXT NOT NULL,                   -- acc_<ULID26>
  state          TEXT NOT NULL CHECK (state IN ('REQUESTED','HELD','RELEASED','EXPIRED','CONSUMED')),
  fence          INTEGER NOT NULL CHECK (fence >= 1),
  held_at        TEXT,
  expires_at     TEXT,
  extensions     INTEGER NOT NULL DEFAULT 0 CHECK (extensions BETWEEN 0 AND 1),
  revision       INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX item_lock_one_held ON item_lock(item_id) WHERE state = 'HELD';
```
- Provenance: `held_at` set by server clock; no client timestamps.
- Data classes (ASSUMPTION): `item_id` PUBLIC for listed items; `owner_party_id` PSEUDONYMOUS.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md). Codes `CYC_LOCK.<CODE>`.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
The partial unique index enforces R01 even under races. Fence values never decrease.

## Privacy, retention, abuse
Lock rows retained for the cycle lifetime plus 30 days (ASSUMPTION, D07 PROVISIONAL), then removed. Lock rows never carry item descriptions.

## Observability & budgets
Counts per state; no `item_id` labels in metrics.

## Tests
- TEST-PS-023-01-01 (schema): second HELD lock for same item rejected by index.
- TEST-PS-023-01-02 (property): fence strictly increases per item across 10 000 acquire/release cycles.
- TEST-PS-023-01-03 (integration): availability record in F01.S03.M01 untouched by lock operations.

## Acceptance criteria
1. Index enforces single HELD lock per item.
2. Fence monotonic across restarts.
3. No write path into F01 availability tables from this module.

## Assumptions & open decisions
- ASSUMPTION: `lck_` prefix pending CTR-ID-001; lock TTL values.
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved): cycle size 2–8 parties.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 30-day post-cycle retention.

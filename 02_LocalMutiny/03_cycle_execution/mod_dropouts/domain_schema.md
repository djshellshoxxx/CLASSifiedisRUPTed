# PS-022-01 — Domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-01.R01 | One `dropout_case` per (`cycle_id`, `proposal_version`, `party_id`); a second detection is merged, not duplicated. | MVP |
| PS-022-01.R02 | `reason_code` ∈ {WITHDREW, LOCK_TIMEOUT, ATTEST_TIMEOUT, CONSENT_EXPIRED, UNREACHABLE} (closed enum; no free text). | MVP |
| PS-022-01.R03 | `resolution` ∈ {PENDING, RESOLVED_RESOLVE_AGAIN, RESOLVED_CANCELLED, RESOLVED_PARTIAL, ESCALATED}. | MVP |
| PS-022-01.R04 | Each case references the locks it affects by `lck_` ID (mod_lock) and never copies lock state. | MVP |

## Data / schema
```sql
CREATE TABLE dropout_case (
  dropout_id        TEXT PRIMARY KEY,           -- drp_<ULID26> (ASSUMPTION: prefix pending CTR-ID-001)
  cycle_id          TEXT NOT NULL,              -- cyc_<ULID26>
  proposal_version  INTEGER NOT NULL CHECK (proposal_version >= 1),
  party_id          TEXT NOT NULL,              -- acc_<ULID26>
  reason_code       TEXT NOT NULL CHECK (reason_code IN ('WITHDREW','LOCK_TIMEOUT','ATTEST_TIMEOUT','CONSENT_EXPIRED','UNREACHABLE')),
  detected_by       TEXT NOT NULL CHECK (detected_by IN ('party','timer','system')),
  resolution        TEXT NOT NULL DEFAULT 'PENDING',
  opened_at         TEXT NOT NULL,              -- RFC 3339 UTC
  resolved_at       TEXT,
  successor_version INTEGER,                    -- set when RESOLVED_RESOLVE_AGAIN
  revision          INTEGER NOT NULL DEFAULT 1,
  UNIQUE (cycle_id, proposal_version, party_id)
);
CREATE TABLE dropout_lock_ref (dropout_id TEXT NOT NULL, lock_id TEXT NOT NULL, PRIMARY KEY (dropout_id, lock_id));
```
- Data classes (ASSUMPTION, CTR-SCH-001): all fields PSEUDONYMOUS; `reason_code` visible to the cycle's participants only.
- Owner: this module owns `dropout_case`; locks belong to mod_lock; compensation claims belong to CTR-COM-001 (F09).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md). Codes use `CYC_DROPOUT.<CODE>`.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
The unique key in R01 makes detection idempotent. Writes use `revision` checks.

## Privacy, retention, abuse
Cases retained 180 days after resolution for abuse review (ASSUMPTION, D07 PROVISIONAL), then reduced to aggregate counts. No free-text reasons, so no accusation text is stored.

## Observability & budgets
Counts by `reason_code` and cycle size; no `party_id` labels.

## Tests
- TEST-PS-022-01-01 (unit): duplicate detection merges to one row.
- TEST-PS-022-01-02 (schema): reason_code outside enum rejected.
- TEST-PS-022-01-03 (integration): dropout row references lock IDs without copying lock state.

## Acceptance criteria
1. Schema migrates from empty and from prior revision.
2. No free-text column exists in `dropout_case`.
3. Lock references resolve to mod_lock records.

## Assumptions & open decisions
- ASSUMPTION: `drp_` prefix pending CTR-ID-001.
- [DECISIONS.md](../../../DECISIONS.md) D04 — partial execution. PROVISIONAL (D04 default, unapproved): dropout produces per-party outcomes, not an atomic result.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 180-day abuse-review retention.

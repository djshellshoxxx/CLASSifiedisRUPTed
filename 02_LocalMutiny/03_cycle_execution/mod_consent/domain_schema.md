# PS-021-01 — Domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-01.R01 | Each consent row binds one `cyc_` ID, one `proposal_version` (integer ≥ 1) and one `snapshot_hash` (SHA-256 of RFC 8785 JCS of: ordered party IDs, item IDs, quote IDs, compensation amounts, expiry). | MVP |
| PS-021-01.R02 | Exactly one row per (`cycle_id`, `proposal_version`, `party_id`). A second decision for the same key is rejected, never overwritten. | MVP |
| PS-021-01.R03 | `decision` ∈ {ACCEPTED, REJECTED, WITHDRAWN}. No default or implicit ACCEPTED value exists. | MVP |
| PS-021-01.R04 | Cycle size 2–8 parties (D02 default, PROVISIONAL). Consent rows per cycle version ≤ 8. | MVP |
| PS-021-01.R05 | Each row holds `consent_record_ref` to the canonical record in F10.S01.M01 mod_consent. Fields of that record are never copied here. | MVP |

## Data / schema
```sql
CREATE TABLE cycle_consent (
  consent_id          TEXT PRIMARY KEY,            -- cns_<ULID26> (ASSUMPTION: prefix pending CTR-ID-001)
  cycle_id            TEXT NOT NULL,               -- cyc_<ULID26>
  proposal_version    INTEGER NOT NULL CHECK (proposal_version >= 1),
  party_id            TEXT NOT NULL,               -- acc_<ULID26>; authorization uses acc_ only (CTR-CAP-001 R02)
  decision            TEXT NOT NULL CHECK (decision IN ('ACCEPTED','REJECTED','WITHDRAWN')),
  snapshot_hash       TEXT NOT NULL CHECK (length(snapshot_hash) = 64),
  consent_record_ref  TEXT NOT NULL,               -- F10.S01.M01 record ID (canonical owner)
  decided_at          TEXT NOT NULL,               -- RFC 3339 UTC, server clock
  expires_at          TEXT NOT NULL,               -- decided_at + consent TTL (validation_rules.md)
  idempotency_key     TEXT NOT NULL UNIQUE,
  revision            INTEGER NOT NULL DEFAULT 1,  -- CTR-EVT-001 revision check
  UNIQUE (cycle_id, proposal_version, party_id)
);
```
- Provenance: `decided_by` is the authenticated `acc_` at decision time; request-body party fields are ignored.
- Data classes (ASSUMPTION, final mapping per CTR-SCH-001): `party_id` and `snapshot_hash` PSEUDONYMOUS; timestamps PUBLIC to participants only.
- Owner: this module owns `cycle_consent` rows. Canonical consent record class: **F10.S01.M01 mod_consent** (B-06; PROVISIONAL).

## Commands / queries / events
Covered in [commands_queries_events.md](commands_queries_events.md). Schema versions: `cycle_consent` 1.0.0.

## States & transitions
Row lifecycle is defined in [workflow_state_machine.md](workflow_state_machine.md). Rows are append-only; a changed decision is a new row only for a new `proposal_version`.

## Validation & errors
Rules in [validation_rules.md](validation_rules.md). Error codes use `CYC_CONSENT.<CODE>` and `SYS.CONFLICT` from CTR-ERR-001.

## Authorization
Actor `acc_` in `participant` scope for the cycle (CTR-CAP-001 R04). Capability `cyc.consent`.

## Failure, idempotency, concurrency, offline
Unique constraints above enforce R02 under concurrent writes; the database rejects the second writer. Offline queueing follows D08 (see failure_recovery_idempotency.md).

## Privacy, retention, abuse
Consent rows are kept for the life of the cycle plus 90 days (ASSUMPTION, D07 default, PROVISIONAL), then deleted or reduced to counts. Legal-hold exception per CTR-PRV-001 R07.

## Observability & budgets
Row counts per state, no `party_id` in metrics labels. Budget: insert p95 ≤ 50 ms at 10k rows (ASSUMPTION).

## Tests
- TEST-PS-021-01-01 (unit): R02 duplicate key returns CONFLICT; no overwrite.
- TEST-PS-021-01-02 (property): any snapshot field change alters `snapshot_hash`.
- TEST-PS-021-01-03 (integration): `consent_record_ref` resolves to F10.S01.M01 record; no copied fields.

## Acceptance criteria
1. R01–R05 pass in CI.
2. Schema migration 1.0.0 applied in a clean and an upgraded database.
3. No consent row exists without a canonical record reference.

## Assumptions & open decisions
- ASSUMPTION: `cns_` prefix and TTL values pending CTR-ID-001 and D07.
- [DECISIONS.md](../../../DECISIONS.md) D02 — cycle size bound. PROVISIONAL (D02 default, unapproved): 2–8 parties.
- [DECISIONS.md](../../../DECISIONS.md) D07 — retention. PROVISIONAL (D07 default, unapproved): 90 days after cycle end.

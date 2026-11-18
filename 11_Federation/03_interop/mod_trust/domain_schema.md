# PS-091-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-FED-001, CTR-PRV-001, CTR-SCH-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-01.R01 | Each federation peer `fpr_` has one trust row holding one `trust_state` in {pending, trusted, restricted, quarantined, revoked}. | MVP |
| PS-091-01.R02 | Every state change is one append-only `trs_` row; `revision` per peer starts at 1 and increments by 1 (CTR-EVT-001 R02). | MVP |
| PS-091-01.R03 | Trust rows hold reason codes and evidence references only. No item content, payload digests, names, IP addresses or free text. | MVP |
| PS-091-01.R04 | Signing keys are referenced by `key_id` (CTR-FED-001 R09). Key material is never stored here. | MVP |
| PS-091-01.R05 | The peer node record `nod_` belongs to F11 root. This module owns only trust state and assessments. | MVP |

## Data / schema
```sql
CREATE TABLE fed_peer_trust (
  peer_id      CHAR(30) PRIMARY KEY CHECK (peer_id ~ '^fpr_[0-9A-HJKMNP-TV-Z]{26}$'),
  trust_state  TEXT NOT NULL CHECK (trust_state IN ('pending','trusted','restricted','quarantined','revoked')),
  revision     INTEGER NOT NULL CHECK (revision >= 1),
  updated_at   TIMESTAMPTZ NOT NULL
);
CREATE TABLE trs_assessment (
  trs_id         CHAR(30) PRIMARY KEY,              -- ulid; prefix PENDING CTR-ID-001 registry entry
  peer_id        CHAR(30) NOT NULL REFERENCES fed_peer_trust(peer_id),
  revision       INTEGER NOT NULL,
  from_state     TEXT NOT NULL,
  to_state       TEXT NOT NULL,
  trigger        TEXT NOT NULL CHECK (trigger IN ('admitted','restricted','quarantined','restored','revoked')),
  reason_code    TEXT NOT NULL,                     -- registry, see PS-091-02
  evidence_ref   TEXT NULL,                         -- evd_, rpt_ or cas_ ID; never content
  source_kind    TEXT NOT NULL CHECK (source_kind IN ('admin','automated','moderation','key_event')),
  actor_ref      TEXT NOT NULL,                     -- acc_ | sys_ | ope_ | mod_
  correlation_id CHAR(30) NOT NULL,                 -- cor_ (CTR-ID-001)
  recorded_at    TIMESTAMPTZ NOT NULL,
  UNIQUE (peer_id, revision)
);
```
Field classes (CTR-PRV-001): `peer_id`, `trust_state`, `to_state`, `trigger`, `revision` = PUBLIC. `reason_code`, `evidence_ref`, `actor_ref` = PSEUDONYMOUS, operator scope only. No column may hold PRIVATE_PERSONAL or higher.

Provenance: every row carries `source_kind`, `actor_ref` and `correlation_id`. Rows are never updated or deleted except by redaction (CTR-EVT-001 R08).

## Commands / queries / events
See [PS-091-04](commands_queries_events.md).

## States & transitions
See [PS-091-03](workflow_state_machine.md).

## Validation & errors
See [PS-091-02](validation_rules.md).

## Authorization
See [PS-091-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-091-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-091-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-091-08](observability_performance.md).

## Tests
- `TEST-PS-091-01-01` unit: schema constraints reject a state outside the enum and a revision of 0.
- `TEST-PS-091-01-02` property: `UNIQUE (peer_id, revision)` holds under 10 000 random transition sequences.
- `TEST-PS-091-01-03` contract: no column in either table has class above LOCATION_COARSE; CI fails on an unclassified column (`PRV.UNCLASSIFIED_FIELD`).

## Acceptance criteria
1. Every table column has a CTR-PRV-001 class and a constraint.
2. `trs_` count per peer equals `fed_peer_trust.revision` (verified by PS-091-06 reconciliation).
3. No column stores content, names, IPs or key material (verified by TEST-PS-091-01-03).

## Assumptions & open decisions
- ASSUMPTION: `trs_` prefix is new and needs a CTR-ID-001 registry entry (owner F11 proposed). Until then the ID is `PENDING CTR-ID-001`.
- D01 (federated record protocol), PROVISIONAL default: versioned signed envelopes with explicit opt-in (unapproved).
- D10 (auth and portability), PROVISIONAL default: user-controlled keys; this module references key IDs only (unapproved).

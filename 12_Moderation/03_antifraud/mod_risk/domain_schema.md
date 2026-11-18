# PS-100-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-COM-001 (claim status only), CTR-SCH-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-01.R01 | A risk assessment `rsk_` is about one subject: an account `acc_`, a listing `lst_`, a service `srv_`, a rental `rnt_`, an auction `auc_`, or a cycle proposal `cyc_`. | MVP |
| PS-100-01.R02 | An assessment stores a tier (`low`, `medium`, `high`, `critical`), up to three reason categories, model version and a feature-set hash. It never stores a raw numeric score for the subject. | MVP |
| PS-100-01.R03 | Assessments expire after 30 days or on a new trigger, whichever is first. | MVP |
| PS-100-01.R04 | Feature inputs are referenced by signal IDs from `mod_signals`; this module stores no raw behavioral logs. | MVP |
| PS-100-01.R05 | Each change is an append-only `rsk_event` row with `revision` starting at 1. | MVP |

## Data / schema
```sql
CREATE TABLE rsk_assessment (
  rsk_id         CHAR(30) PRIMARY KEY,           -- rsk_ ULID; prefix PENDING CTR-ID-001 registry entry
  subject_type   TEXT NOT NULL CHECK (subject_type IN ('acc','lst','srv','rnt','auc','cyc')),
  subject_ref    CHAR(30) NOT NULL,
  state          TEXT NOT NULL,                  -- PS-100-03
  revision       INTEGER NOT NULL CHECK (revision >= 1),
  tier           TEXT NULL CHECK (tier IN ('low','medium','high','critical')),
  reason_codes   TEXT[] NULL CHECK (cardinality(reason_codes) <= 3),
  model_version  TEXT NOT NULL,
  feature_hash   BYTEA NULL,                     -- keyed hash of signal IDs and buckets
  signal_refs    TEXT[] NULL,                    -- sig_ IDs owned by mod_signals
  created_at     TIMESTAMPTZ NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL            -- created_at + 30 days max
);
```
Field classes (CTR-PRV-001): `subject_ref`, `signal_refs`, `feature_hash` = PSEUDONYMOUS; `tier`, `reason_codes`, `state` = PUBLIC to operators in case scope only (never shown to the subject as a tier; the subject sees only the generic state). `model_version` = PUBLIC.

Provenance: `correlation_id` links the assessment to the triggering event (listing publish, auction bid, cycle proposal, payment claim).

## Commands / queries / events
See [PS-100-04](commands_queries_events.md).

## States & transitions
See [PS-100-03](workflow_state_machine.md).

## Validation & errors
See [PS-100-02](validation_rules.md).

## Authorization
See [PS-100-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-100-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-100-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-100-08](observability_performance.md).

## Tests
- `TEST-PS-100-01-01` unit: `subject_type` enum and `reason_codes` cardinality ≤ 3 enforced.
- `TEST-PS-100-01-02` contract: no numeric score column exists.
- `TEST-PS-100-01-03` privacy: `signal_refs` contain IDs only (no values).

## Acceptance criteria
1. Every assessment has a tier, reason count ≤ 3, model version and expiry ≤ 30 days.
2. No raw score or raw feature value is stored.
3. Schema scan passes CTR-PRV-001 classification.

## Assumptions & open decisions
- ASSUMPTION: `rsk_` is a new prefix to register with CTR-ID-001 (owner F12).
- D06 (receipts), PROVISIONAL default: receipt presence is an input signal only; signed statements, not verified events (unapproved).
- D04 (partial barter execution), PROVISIONAL default: `cyc` assessments route to review only (unapproved).

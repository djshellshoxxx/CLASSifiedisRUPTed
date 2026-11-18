# PS-097-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001, CTR-EVT-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-01.R01 | Each evaluated item has one spam verdict `spm_` for one subject (`lst_`, `srv_`, `msg_`, or inbound federated item ref). | MVP |
| PS-097-01.R02 | A verdict stores a decision, reason code, model version and a confidence band (`low`, `mid`, `high`), never a raw score. | MVP |
| PS-097-01.R03 | Feature vectors store only keyed hashes (SimHash of normalized text, perceptual image hash, link domain hash). Raw text is not stored by this module. | MVP |
| PS-097-01.R04 | Private message subjects (`msg_`) store metadata features only (send rate, recipient novelty, link count, prior block count). | MVP |
| PS-097-01.R05 | Each change is an append-only `spm_event` row with `revision` starting at 1. | MVP |

## Data / schema
```sql
CREATE TABLE spm_verdict (
  spm_id         CHAR(30) PRIMARY KEY,           -- spm_ ULID; prefix PENDING CTR-ID-001 registry entry
  subject_type   TEXT NOT NULL CHECK (subject_type IN ('lst','srv','msg','fed_item')),
  subject_ref    TEXT NOT NULL,                  -- lst_ | srv_ | msg_ | fed item digest reference
  author_ref     CHAR(30) NOT NULL,              -- acc_ (pseudonymous)
  state          TEXT NOT NULL,                  -- PS-097-03
  revision       INTEGER NOT NULL CHECK (revision >= 1),
  decision       TEXT NULL CHECK (decision IN ('allow','quarantine','reject')),
  reason_code    TEXT NULL,                      -- PS-097-02 registry
  confidence     TEXT NULL CHECK (confidence IN ('low','mid','high')),
  model_version  TEXT NOT NULL,                  -- semver, CTR-SCH-001
  feature_hash   BYTEA NULL,                     -- keyed hash of feature set; no raw content
  created_at     TIMESTAMPTZ NOT NULL,
  decided_at     TIMESTAMPTZ NULL
);
```
Field classes (CTR-PRV-001): `subject_ref`, `author_ref`, `model_version` = PSEUDONYMOUS; `decision`, `reason_code`, `confidence`, `state` = PUBLIC to the author only; `feature_hash` = PSEUDONYMOUS (never exported). No column holds text, coordinates or contact data.

Provenance: `correlation_id` links the verdict to the creating command (listing publish, message send, or federation batch).

## Commands / queries / events
See [PS-097-04](commands_queries_events.md).

## States & transitions
See [PS-097-03](workflow_state_machine.md).

## Validation & errors
See [PS-097-02](validation_rules.md).

## Authorization
See [PS-097-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-097-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-097-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-097-08](observability_performance.md).

## Tests
- `TEST-PS-097-01-01` unit: `subject_type` enum enforced; `decision` null until `decided`.
- `TEST-PS-097-01-02` contract: schema scan finds no free-text column.
- `TEST-PS-097-01-03` privacy: `msg` verdicts have only metadata-derived feature keys (fixture inspection).

## Acceptance criteria
1. One verdict per (subject, model_version).
2. No raw message text in any table, cache or log.
3. Schema scan passes CTR-PRV-001 classification.

## Assumptions & open decisions
- ASSUMPTION: `spm_` is a new prefix to register with CTR-ID-001 (owner F12).
- D01 (federated protocol), PROVISIONAL default: inbound federated items are evaluated only after signature verification (unapproved).
- D07 (retention), PROVISIONAL default: verdicts kept 90 days (PS-097-07) (unapproved).

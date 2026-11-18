# PS-092-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001 (referenced, not redefined).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-01.R01 | An appeal `apl_` targets exactly one of: enforcement action `enf_`, spam verdict `spm_`, or report closure decision on `rpt_` within `cas_`. | MVP |
| PS-092-01.R02 | At most one open appeal per target (partial unique index). | MVP |
| PS-092-01.R03 | Appeal body ≤ 2 000 characters; attachments only as `evd_` references owned by `mod_evidence`. | MVP |
| PS-092-01.R04 | Appeal records store the reviewer `mod_` ID and the decision reason code, not reporter identity. | MVP |
| PS-092-01.R05 | Each state change is an append-only `apl_event` row with `revision` starting at 1. | MVP |

## Data / schema
```sql
CREATE TABLE apl_appeal (
  apl_id         CHAR(30) PRIMARY KEY,          -- apl_ ULID; prefix PENDING CTR-ID-001 registry entry
  target_type    TEXT NOT NULL CHECK (target_type IN ('enforcement','spam_verdict','report_closure')),
  target_id      CHAR(30) NOT NULL,             -- enf_ | spm_ | rpt_
  case_id        CHAR(30) NOT NULL,             -- cas_
  appellant_ref  CHAR(30) NOT NULL,             -- acc_ of the affected subject
  state          TEXT NOT NULL,                 -- see PS-092-03
  revision       INTEGER NOT NULL CHECK (revision >= 1),
  body           TEXT NULL CHECK (char_length(body) <= 2000),
  reviewer_ref   CHAR(30) NULL,                 -- mod_ principal
  decision_code  TEXT NULL,                     -- UPHELD | MODIFIED | REVERSED
  received_at    TIMESTAMPTZ NOT NULL,
  window_ends_at TIMESTAMPTZ NOT NULL           -- target notice time + 30 days (ASSUMPTION)
);
CREATE UNIQUE INDEX apl_one_open_per_target ON apl_appeal (target_id)
  WHERE state NOT IN ('closed','withdrawn','ineligible');
```
Field classes (CTR-PRV-001): `body` = PRIVATE_PERSONAL; `appellant_ref`, `reviewer_ref`, `target_id`, `decision_code` = PSEUDONYMOUS; `state`, `revision` = PUBLIC. Reporter identifiers are not stored on this table (they live in `rpt_` under F12.S01.M01).

Provenance: `correlation_id` (cor_) links the appeal to the originating enforcement or flag command.

## Commands / queries / events
See [PS-092-04](commands_queries_events.md).

## States & transitions
See [PS-092-03](workflow_state_machine.md).

## Validation & errors
See [PS-092-02](validation_rules.md).

## Authorization
See [PS-092-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-092-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [PS-092-07](privacy_retention_abuse.md).

## Observability & budgets
See [PS-092-08](observability_performance.md).

## Tests
- `TEST-PS-092-01-01` unit: partial unique index rejects a second open appeal for one target.
- `TEST-PS-092-01-02` unit: body of 2 001 characters rejected; 2 000 accepted.
- `TEST-PS-092-01-03` contract: no reporter identifier present on `apl_appeal` (schema scan).

## Acceptance criteria
1. Each appeal links to exactly one target and one case.
2. Body is PRIVATE_PERSONAL and absent from every event payload.
3. Schema scan finds zero reporter identifiers.

## Assumptions & open decisions
- ASSUMPTION: `apl_` is a new prefix (ulid class) to be registered in CTR-ID-001, owner F12.
- D07 (retention), PROVISIONAL default: minimal retention with legal-hold exceptions (unapproved).

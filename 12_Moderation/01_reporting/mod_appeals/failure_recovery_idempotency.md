# PS-092-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-ERR-001, CTR-CAP-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-06.R01 | Submit is idempotent on (appellant, `appeal.submit`, key). Same digest → original `apl_`; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. | MVP |
| PS-092-06.R02 | Reversal to `mod_enforcement` is exactly-once in effect: consumer dedupes on `apl_id` + `decision_revision`. | MVP |
| PS-092-06.R03 | `decided` persists even if the enforcement service is unavailable; the outbox retries with backoff 1 s → 10 min cap (ASSUMPTION). | MVP |
| PS-092-06.R04 | Two reviewers deciding the same `apl_` → one wins by `expected_revision`; the other gets `EVT.REVISION_CONFLICT`. | MVP |
| PS-092-06.R05 | Backlog job lists `decided` appeals without `implemented` after 24 h; operator resolves, no automatic reversal. | MVP |

## Data / schema
Idempotency rows as in PS-091-06 (`actor_ref`, `command_type`, key, digest, response, 7-day retention). Outbox row: `event_id`, `apl_id`, `revision`, `payload_digest`.

## Commands / queries / events
Each decide command is one transaction: check revision, insert `apl_event`, update `apl_appeal`, insert outbox row.

## States & transitions
No state is visible without its event row. Rollback of a partial transaction leaves the prior state intact.

## Validation & errors
Retry-safe: `EVT.REVISION_CONFLICT` no (re-read first); `SYS.UNAVAILABLE` yes (shared code, backoff). Validation codes are non-retryable.

## Authorization
Authorization is re-evaluated on every retry (a revoked reviewer grant denies the retry).

## Failure, idempotency, concurrency, offline
- Timeouts: server 2 s; clients retry only with the same key, max 5 attempts, jittered backoff.
- Offline: the PWA may queue an appeal draft locally under D08 (pending until server acknowledgement). Submission is not final until `appeal.received`. Drafts with body text stay on-device and are not synced until the user submits.
- Partial failure after `decided` but before outbox insert is impossible (same transaction).

## Privacy, retention, abuse
Idempotency rows store digests, never body text.

## Observability & budgets
Metric `appeals_backlog_age_seconds` (oldest `decided` without `implemented`); alert at 24 h.

## Tests
- `TEST-PS-092-06-01` integration: 20 parallel `appeal.decide` → one winner per revision.
- `TEST-PS-092-06-02` integration: enforcement service offline for 1 h → decision persists, reversal applied once on recovery.
- `TEST-PS-092-06-03` integration: duplicate `appeal.decided` delivery → single enforcement reversal.
- `TEST-PS-092-06-04` offline: draft survives app restart; not transmitted before submit.

## Acceptance criteria
1. Zero double reversals in the fault-injection suite.
2. No `decided` appeal lost across restarts.
3. Backlog alert verified in drill.

## Assumptions & open decisions
- ASSUMPTION: 24 h backlog threshold and 14-day SLA are defaults for F12 review.
- D08 (PWA offline writes), PROVISIONAL default: local pending queue until authenticated relay acknowledgement (unapproved).

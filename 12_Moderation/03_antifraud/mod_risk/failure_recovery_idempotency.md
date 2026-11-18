# PS-100-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-ERR-001, CTR-COM-001 (finality is not decided here).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-06.R01 | `risk.assess` is idempotent per (subject_ref, correlation_id). Re-run after failure returns the existing assessment. | MVP |
| PS-100-06.R02 | Assessment runs asynchronously from a durable queue with backoff 1 s → 10 min cap (ASSUMPTION). Missing signals do not stop assessment; they lower confidence. | MVP |
| PS-100-06.R03 | If the scorer is unavailable, the subject is not held (no fail-closed on publication for scorer outage); the listing remains visible with a `pending_assessment` flag for ≤ 15 min, then review is routed automatically. | MVP |
| PS-100-06.R04 | Holds and clearances are revision-checked; concurrent operations resolve to one winner (`EVT.REVISION_CONFLICT` for the other). | MVP |
| PS-100-06.R05 | Step-up callbacks from F07 are idempotent per `rsk_id` and callback ID; duplicates return the same result. | MVP |

## Data / schema
Queue rows: `correlation_id`, `subject_ref`, `attempts`, `next_attempt_at`, `status`. Idempotency rows per PS-091-06.

## Commands / queries / events
Assessment transaction writes `rsk_assessment`, routing events and the outbox in one commit.

## States & transitions
Recovery: an assessment that failed before commit is re-run; after commit it is never re-tiered except by a new trigger.

## Validation & errors
`RISK.SCORE_UNAVAILABLE` (503, retryable) only for synchronous status calls; the queue retries silently.

## Authorization
Re-evaluated per retry.

## Failure, idempotency, concurrency, offline
- Offline: risk is server-side only; offline listing drafts (D08) are assessed after acknowledgement and shown as pending.
- Partial failure: after `risk.assessed` but before `review_routed`, a reconciliation job re-emits routing from the committed tier (outbox-driven, no re-scoring).
- Clock: step-up expiry uses server time only.

## Privacy, retention, abuse
Queue and idempotency rows hold IDs and attempt counts only.

## Observability & budgets
Alert: queue age > 15 min for listings (page); reconciliation finds routing gaps (ticket).

## Tests
- `TEST-PS-100-06-01` integration: scorer down 20 min → listing visible with `pending_assessment`, auto-routed after 15 min.
- `TEST-PS-100-06-02` integration: crash after `assessed` commit → routing re-emitted once, no re-score.
- `TEST-PS-100-06-03` integration: clear vs new hold race → one winner, one conflict.
- `TEST-PS-100-06-04` integration: duplicate step-up callback → single transition.

## Acceptance criteria
1. No double routing or double hold in fault-injection suite.
2. Scorer outage never hides listings beyond the 15 min flag rule.
3. Re-scoring after commit never happens without a new trigger.

## Assumptions & open decisions
- ASSUMPTION: 15 min pending-assessment window is a default for F01 and F12 review.
- D08 (PWA offline writes), PROVISIONAL default: pending queue until relay acknowledgement (unapproved).
- D04 (partial barter execution), PROVISIONAL default: no recovery step removes a consent; compensations are F02 concerns (unapproved).

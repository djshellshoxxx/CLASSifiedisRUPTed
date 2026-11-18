# PS-097-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-ERR-001, CTR-FED-001 (R05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-06.R01 | Evaluation is idempotent on (subject_ref, model_version). Repeats return the stored verdict. | MVP |
| PS-097-06.R02 | Listings and services are `pending_evaluation` (not discoverable) until a verdict exists. Evaluation retries run with backoff 1 s → 5 min cap (ASSUMPTION). | MVP |
| PS-097-06.R03 | Message sends are not blocked by scorer outage. Messages are allowed under a stricter send-rate limit from `mod_rate` (fail-open with throttle). | MVP |
| PS-097-06.R04 | Federated items are rejected for scoring until signature verification succeeds; evaluation failure defers the item (CTR-FED-001 deferred outcome). | MVP |
| PS-097-06.R05 | Expiry job for 7-day quarantine is idempotent and runs every 5 min (ASSUMPTION). | MVP |

## Data / schema
Idempotency rows as PS-091-06. Evaluation queue rows: `subject_ref`, `model_version`, `attempts`, `next_attempt_at`, `status`.

## Commands / queries / events
Evaluate runs in a transaction that writes the verdict and the outbox event together.

## States & transitions
A subject that fails evaluation stays in `pending_evaluation`; no partial verdict is written.

## Validation & errors
`SPAM.SCORE_UNAVAILABLE` (503, retryable true) is returned to synchronous callers only; internal queue retries silently.

## Authorization
`sys_` credential rotation does not interrupt queued evaluations (credentials resolved per attempt).

## Failure, idempotency, concurrency, offline
- Model rollback: a verdict records `model_version`; re-evaluation under the rolled-back version creates a new verdict and does not overwrite the old one.
- Offline: listing drafts created offline are evaluated after relay acknowledgement (D08); they are not visible until evaluated.
- Outage: after 30 min of scorer outage, operators are alerted and new listings stay pending. Message throttling tightens during outage.

## Privacy, retention, abuse
Queue rows hold IDs and attempt counts only.

## Observability & budgets
`spam_evaluation_backlog_seconds` gauge; alert at 15 min pending for listings.

## Tests
- `TEST-PS-097-06-01` integration: scorer down 20 min → listing pending, not discoverable; evaluated once after recovery.
- `TEST-PS-097-06-02` integration: scorer down → message delivered under throttle; no verdict-based block.
- `TEST-PS-097-06-03` integration: duplicate evaluation → one verdict.
- `TEST-PS-097-06-04` integration: unverified federated item deferred, not scored.

## Acceptance criteria
1. No listing is publicly visible without a verdict.
2. Scorer outage never blocks message delivery.
3. No duplicate verdicts under retry tests.

## Assumptions & open decisions
- ASSUMPTION: listing fail-closed and message fail-open is a deliberate split; F12 Trust&Safety to confirm.
- D08 (PWA offline writes), PROVISIONAL default: pending queue until relay acknowledgement (unapproved).
- D01 (federated protocol), PROVISIONAL default: defer rather than accept unverified items (unapproved).

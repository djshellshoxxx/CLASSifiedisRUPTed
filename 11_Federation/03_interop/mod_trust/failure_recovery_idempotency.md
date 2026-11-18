# PS-091-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-FED-001 (R05, R06, R13), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-06.R01 | Same key and same request digest return the original response and create no new row or event (CTR-EVT-001 R03). Key records kept 7 days. | MVP |
| PS-091-06.R02 | Concurrent transitions use optimistic revision checks. The loser receives `EVT.REVISION_CONFLICT` and must re-read. | MVP |
| PS-091-06.R03 | A quarantine event always wins over a concurrent restore that does not reference it, because restore requires the current revision. | MVP |
| PS-091-06.R04 | Outbox events are published at least once with backoff 1 s, 2 s, 4 s … capped at 10 min (ASSUMPTION). Consumers dedupe on `event_id`. | MVP |
| PS-091-06.R05 | A reconciliation job compares `count(trs_) per peer` with `fed_peer_trust.revision` every 15 min and raises `TRUST.REVISION_DRIFT` (alert only). | MVP |

## Data / schema
Idempotency table: `(actor_ref, command_type, idempotency_key, request_digest, response, created_at)`. Digest = SHA-256 of JCS-canonical body.

## Commands / queries / events
Single transaction per command: lock `fed_peer_trust` row, check `expected_revision`, insert `trs_`, update state, insert outbox row. Partial writes are not observable.

## States & transitions
Failure mid-transaction rolls back all four writes. No state is visible without its `trs_` row.

## Validation & errors
Retry-safe codes: `TRUST.PEER_NOT_FOUND` no, `EVT.REVISION_CONFLICT` no (re-read first), `SYS.UNAVAILABLE` yes (not defined here, shared code).

## Authorization
Authorization is re-evaluated on retry; a grant revoked between attempts denies the retry.

## Failure, idempotency, concurrency, offline
- Timeouts: server 2 s; client retries only with the same `Idempotency-Key`, backoff with jitter, max 5 attempts.
- Offline: trust commands are online-only. The PWA never queues them (D08 pending queue does not apply to trust).
- Recovery after quarantine: relay resumes per peer from last acknowledged batch (`dlv_`) and last `revision`; no replay of rejected events.
- Equivocation during quarantine: both events kept as evidence, no state change beyond the quarantine already in place.

## Privacy, retention, abuse
Idempotency rows hold digests and IDs, not bodies, and expire after 7 days.

## Observability & budgets
Metric `trust_revision_conflict_total`; alert if > 5 % of commands per hour conflict (ASSUMPTION).

## Tests
- `TEST-PS-091-06-01` integration: 50 parallel restrict/restore on one peer → one winner per revision.
- `TEST-PS-091-06-02` integration: kill process after outbox insert → event delivered exactly once to consumers after dedupe.
- `TEST-PS-091-06-03` property: replay of a request with altered body → `EVT.IDEMPOTENCY_KEY_REUSED`.
- `TEST-PS-091-06-04` integration: forced drift → reconciliation alert raised and no state changed.

## Acceptance criteria
1. No command produces a state without a matching `trs_` row (verified by R05 job in test).
2. Retries never create duplicate events.
3. Quarantine is never lost to a concurrent restore (test TEST-PS-091-06-01).

## Assumptions & open decisions
- ASSUMPTION: retry backoff and drift threshold values are defaults for F15 review.
- D08 (PWA offline writes), PROVISIONAL default: local pending queue until relay acknowledgement; not applicable to trust commands (unapproved).

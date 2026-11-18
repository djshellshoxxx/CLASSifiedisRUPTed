# PS-069-06 — failure, recovery, idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-COM-001 (R11). **Decisions:** D08 (PROVISIONAL default, unapproved), D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-06.R01 | Idempotency record per (actor, command, key) retained 7 days (RET-OPS); replay within window returns original response. | MVP |
| PS-069-06.R02 | Client timeout 10 s; server-side adapter call timeout 2 s; no retry of non-retryable codes. | MVP |
| PS-069-06.R03 | Client retry: exponential backoff 1 s, 2 s, 4 s with ±20% jitter; max 3 attempts, only for codes with retryable = true. | MVP |
| PS-069-06.R04 | A route is never shown as `DECLARED` to the counterparty before the server commit is acknowledged. | MVP |
| PS-069-06.R05 | Adapter failure mid-declare leaves no row; the request returns `NONCUST.RAIL_UNAVAILABLE`. | MVP |

## Data / schema
`idempotency` table: `actor_ref`, `command`, `key`, `request_digest` (SHA-256), `response_digest`, `route_id`, `created_at`, `expires_at` (created_at + 7 d).

## Commands / queries / events
Applies to all commands in PS-069-04. Adapter registry events are replayed idempotently by (`adapter_id`, `adapter_revision`).

## States & transitions
No new states. Partial failure leaves the route at its prior state (no `PENDING` state exists).

## Validation & errors
`EVT.IDEMPOTENCY_KEY_REUSED` for same key with different digest (not retryable). `SYS.CONFLICT` for stale `expected_state_version` (not retryable without re-read). `SYS.UNAVAILABLE` for store outage (retryable).

## Authorization
Replay is authorized by the original actor only; a different actor using the same key receives `EVT.IDEMPOTENCY_KEY_REUSED`.

## Failure, idempotency, concurrency, offline
- Concurrency: optimistic lock on `state_version`; conflict returns `SYS.CONFLICT`.
- Offline (D08): declare requests sit in the device pending queue until relay acknowledgment. The UI shows "Sent, waiting for confirmation", never "Active". Queue cap 20 items; oldest unacknowledged item older than 72 h is surfaced to the user for retry or discard.
- Recovery: after store restore, pending adapter sync replays from last acknowledged `adapter_revision`.

## Privacy, retention, abuse
Idempotency rows hold digests only, never request bodies (RET-OPS). Offline queue entries are encrypted on device and wiped on logout.

## Observability & budgets
Metrics: replay hit rate, conflict rate, retry count per command, pending-queue depth. Alert when conflict rate exceeds 2% over 15 min.

## Tests
- TEST-PS-069-06-01 (unit): backoff schedule values and jitter bounds.
- TEST-PS-069-06-02 (integration): network drop after commit, client retry returns original `route_id`.
- TEST-PS-069-06-03 (offline): declare queued offline shows "Sent, waiting" state until ack; never "Active".
- TEST-PS-069-06-04 (integration): adapter timeout leaves zero route rows.

## Acceptance criteria
1. No duplicate route rows after 1000 injected retries (chaos test).
2. Offline queue never displays a route as active before ack (UI test).
3. Replay window expiry at 7 d is tested with clock fixtures.

## Assumptions & open decisions
- ASSUMPTION: 72 h stale-queue threshold.
- D08 (PROVISIONAL default, unapproved): local pending queue until authenticated relay acknowledgment.
- D09 (PROVISIONAL default, unapproved).

# PS-021-06 — Failure, recovery, idempotency and concurrency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-06.R01 | Duplicate consent command with same `idempotency_key` returns the original result; no second row or event. | MVP |
| PS-021-06.R02 | Concurrent ACCEPT and proposal revision: exactly one outcome applies; the other returns `SYS.CONFLICT`. | MVP |
| PS-021-06.R03 | Server timeout on consent write: client retries with the same key for up to 24 h; after that the key is rejected with `SYS.GONE`. | MVP |
| PS-021-06.R04 | Expiry timer fires at-least-once; EXPIRED transition is idempotent. | MVP |
| PS-021-06.R05 | Offline consent is queued locally and sent only after relay acknowledgment (D08); the UI shows "pending", never "accepted". | MVP |

## Data / schema
Uses `idempotency_key` and `revision` columns from [domain_schema.md](domain_schema.md). Idempotency table `cns_idem` (key, response_digest, created_at) retained 24 h (ASSUMPTION).

## Commands / queries / events
Retries reuse the same envelope and `idempotency_key`; events carry `correlation_id` of the original command.

## States & transitions
Recovery never creates a new decision. Recovery to a previous state is forbidden; corrections are a new proposal version.

## Validation & errors
| Code | Retryable | Class | Notes |
|---|---|---|---|
| SYS.CONFLICT | false | conflict / 409 | client re-reads proposal |
| SYS.PRECONDITION_FAILED | true | precondition_failed / 412 | revision not yet visible; retry after 1 s backoff |
| SYS.UNAVAILABLE | true | unavailable / 503 | exponential backoff 1 s to 60 s, jitter ±20 % |

Timeouts: client 5 s per request; server database statement 2 s.

## Authorization
Retries re-run authorization at commit (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Partial failure: if the event append fails after the row insert, both are in one transaction; no orphan row. Relay outage: pending queue retained up to 7 days, then surfaced as expired locally.

## Privacy, retention, abuse
Idempotency cache stores digests only, not bodies.

## Observability & budgets
Metrics: replay rate, conflict rate, timer lag. Alert when conflict rate > 5 % for 15 min (ASSUMPTION).

## Tests
- TEST-PS-021-06-01 (integration): 100 duplicate sends → one row, one event.
- TEST-PS-021-06-02 (concurrency): ACCEPT vs revision race, 1000 trials, one winner.
- TEST-PS-021-06-03 (offline): queued consent sent after reconnect; rejected if proposal revised meanwhile.

## Acceptance criteria
1. Zero duplicate rows under replay tests.
2. Race outcome deterministic per revision check.
3. Pending offline consents never displayed as accepted.

## Assumptions & open decisions
- ASSUMPTION: 24 h idempotency window; 7-day offline queue.
- [DECISIONS.md](../../../DECISIONS.md) D08 — PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.

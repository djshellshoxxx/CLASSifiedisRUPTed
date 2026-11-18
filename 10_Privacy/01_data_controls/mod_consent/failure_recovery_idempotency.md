# PS-076-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-CAP-001 (Failure section), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-06.R01 | Withdrawal is never lost: a withdrawal accepted by the client is persisted before acknowledgement or is held in the offline queue. | MVP |
| PS-076-06.R02 | Retries of grant or withdraw with the same idempotency key return the original result. | MVP |
| PS-076-06.R03 | If the consent store is unavailable, the consent check returns "not granted" (fail closed) with `SYS.UNAVAILABLE` (retryable). | MVP |
| PS-076-06.R04 | Conflicting offline grant and withdrawal are resolved by server revision order; a stale queued grant is rejected at commit. | MVP |

## Data / schema
Uses `revision` and `idempotency_key` fields from CTR-EVT-001. Idempotency records retained 7 days (CTR-EVT-001 R03).

## Commands / queries / events
Retries apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery paths map onto [workflow_state_machine.md](workflow_state_machine.md). Partial failure after event append and before downstream notify: replay from the event log, never re-run the state change.

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | store or policy down |
| EVT.REVISION_CONFLICT | false | client reloads then retries |
| CONSENT.PROPAGATION_PENDING | true | downstream acknowledgement not yet received (ASSUMPTION) |

## Authorization
Retries re-run authorization on every attempt (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
- Concurrency: aggregate lock per (subject, purpose, scope); `expected_revision` check.
- Offline (D08 default, unapproved): grants and withdrawals queue locally; grant queued with a stale `notice_version` is rejected at commit with `CONSENT.NOTICE_VERSION_STALE`.
- Timeouts: consent check 2 s, then fail closed (ASSUMPTION).
- Backoff for retryable codes: exponential, full jitter, base 1 s, cap 60 s (ASSUMPTION).

## Privacy, retention, abuse
Recovery logs carry request IDs and codes only.

## Observability & budgets
Metrics: `consent_idempotent_replays_total`, `consent_failclosed_total`. Check p95 ≤ 20 ms (ASSUMPTION).

## Tests
- TEST-PS-076-06-01 (idempotency): replay grant returns same `consent_id`, one event.
- TEST-PS-076-06-02 (fault): store outage during check returns not-granted and retryable error.
- TEST-PS-076-06-03 (offline): queued withdrawal survives app restart and is applied once.
- TEST-PS-076-06-04 (concurrency): two offline devices, grant vs withdraw, resolved by revision order.

## Acceptance criteria
1. Zero lost withdrawals in fault-injection runs.
2. Every retry path tested for idempotency.
3. Fail-closed behavior verified for consent checks.

## Assumptions & open decisions
- ASSUMPTION: timeouts and backoff values above.
- PROVISIONAL (D08 default, unapproved): local pending queue until relay acknowledgement.

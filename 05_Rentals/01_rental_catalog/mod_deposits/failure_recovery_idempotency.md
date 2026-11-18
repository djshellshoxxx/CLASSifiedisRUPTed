# PS-040-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency, revision, correlation), CTR-ERR-001 (retry rules), CTR-COM-001 (claim adapter and offline pending), CTR-SCH-001.

**Decision labels:** D08 PWA offline writes PROVISIONAL (unapproved). D09 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-06.R01 | Writes are idempotent per CTR-EVT-001 R03; duplicate key with same digest returns the original result with no new event. | MVP |
| PS-040-06.R02 | Deposit state and linked claim write share one `correlation_id` saga (CTR-EVT-001 R09). | MVP |
| PS-040-06.R03 | A partially failed saga is reconciled from the claim's state, never from client assertions. Reconciliation completes within 15 min (ASSUMPTION). | MVP |
| PS-040-06.R04 | Offline queues hold `deposit.propose`, `deposit.agree` and `deposit.record_given` as pending (D08). Server revalidates at commit. | MVP |
| PS-040-06.R05 | Queued commands with non-retryable codes move to "not applied"; they are never silently dropped. | MVP |
| PS-040-06.R06 | Retries follow CTR-ERR-001: exponential backoff, base 500 ms, cap 60 s, same key. | MVP |

## Data / schema
Idempotency records: key, actor, command, digest, result pointer, 7-day retention (RET-OPS). Saga record: `correlation_id`, deposit ID, claim ID, step, status.

## Commands / queries / events
Each command in PS-040-04 is retry-safe. `deposit.held` is emitted only after the claim event is committed.

## States & transitions
Failure does not add states. A failed transition leaves the status unchanged. Offline-pending is client-side and not a server status.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `COM.VERIFIER_UNAVAILABLE`, `SYS.PRECONDITION_FAILED`. Non-retryable: all `DEPOSITS.*` codes and `COM.*` validation codes.

## Authorization
Recovery jobs run as `sys` principals with write scope on `deposit` only. They cannot create claims for either party.

## Failure, idempotency, concurrency, offline
- Timeout on claim submit: retry with same key; if unknown after 3 retries, reconcile by reading the claim.
- Concurrent release and dispute: revision check; one wins, other gets `SYS.CONFLICT` and re-reads.
- Offline record_given after a rental was cancelled: rejected non-retryable, moved to "not applied".
- Pending consent older than 72 h: cancelled by PS-040-03 R05 on the server, client notified on sync.

## Privacy, retention, abuse
Saga logs hold IDs and step names only. Replay of a stale queued command is blocked by revision checks.

## Observability & budgets
`deposit_saga_open_total`, `deposit_saga_reconciled_total`, `deposit_saga_age_seconds` p95 ≤ 900 (ASSUMPTION).

## Tests
- TEST-PS-040-06-01 (failure injection): claim service times out after commit; saga reconciles to one claim and one deposit transition.
- TEST-PS-040-06-02 (offline): queued `record_given` replayed after cancellation → "not applied" with `message_key`.
- TEST-PS-040-06-03 (idempotency): 100 concurrent identical proposals → one deposit.
- TEST-PS-040-06-04 (backoff): retry schedule matches base 500 ms and cap 60 s.

## Acceptance criteria
1. No orphan claim without a deposit link after recovery (TEST-PS-040-06-01).
2. No queued command silently dropped (TEST-PS-040-06-02).
3. Duplicate proposals never create two active deposits (TEST-PS-040-06-03).

## Assumptions & open decisions
- ASSUMPTION: 15-minute reconciliation, 3 retries before reconcile-by-read.
- PROVISIONAL (D08 default, unapproved).
- PROVISIONAL (D09 default, unapproved).

# PS-043-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency, saga), CTR-ERR-001 (retry), CTR-SCH-001.

**Decision labels:** D08 PROVISIONAL. D04 OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-06.R01 | All writes idempotent (CTR-EVT-001 R03). | MVP |
| PS-043-06.R02 | Timer jobs (overdue at `due_at`, owner window at `declared_at + 7 d`) are idempotent per `(return_id, state_version)`. | MVP |
| PS-043-06.R03 | Close and deposit release request form a saga with `correlation_id`; release request is retried until acknowledged; the return stays CLOSED. | MVP |
| PS-043-06.R04 | Offline declarations queue as pending (D08); server records server commit time for late calculation. | MVP |
| PS-043-06.R05 | Timer lag > 15 min raises an alert (ASSUMPTION). | MVP |

## Data / schema
Saga record: `correlation_id`, return ID, deposit reference, step, status.

## Commands / queries / events
Each command retry-safe. Events committed before outgoing requests.

## States & transitions
No new states; failed steps keep status.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.PRECONDITION_FAILED`. Non-retryable: `RETURN.*`.

## Authorization
`sys` jobs hold write scope on `rental_return` only.

## Failure, idempotency, concurrency, offline
- Timer runs twice: second run is a no-op.
- Declaration offline past rental end: committed with server time; `late_minutes` computed; no charge.
- Deposit service down at close: saga retries; return CLOSED.
- Renter and owner act at once near window end: revision check; one wins.

## Privacy, retention, abuse
Saga logs carry IDs and steps only.

## Observability & budgets
`return_timer_lag_seconds` p95 ≤ 900; `return_saga_open_total`.

## Tests
- TEST-PS-043-06-01 (timer): replayed overdue job → one OVERDUE event.
- TEST-PS-043-06-02 (failure): deposit service down at close → retried; return remains CLOSED.
- TEST-PS-043-06-03 (offline): declaration committed 2 h late → `late_minutes` = 120.
- TEST-PS-043-06-04 (race): owner confirm and owner-window close at same second → one terminal outcome.

## Acceptance criteria
1. No CLOSED return without a deposit request event or a logged retry.
2. Timer replay produces no duplicate events.
3. Offline late commit computes lateness from server time.

## Assumptions & open decisions
- ASSUMPTION: 15-minute timer lag tolerance.
- PROVISIONAL (D08 default, unapproved).

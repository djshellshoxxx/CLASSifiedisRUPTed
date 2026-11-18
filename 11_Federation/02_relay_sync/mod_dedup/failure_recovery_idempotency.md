# PS-087-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Failure section), CTR-EVT-001 (R02, R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-06.R01 | Check-and-record is one atomic upsert; two concurrent identical events yield exactly one `recorded` row. | MVP |
| PS-087-06.R02 | If the index is unavailable, `check_and_record` returns `SYS.UNAVAILABLE` (retryable) and never returns `duplicate` or `accepted` (fail closed). | MVP |
| PS-087-06.R03 | Equivocation detection and quarantine are committed together. | MVP |

## Data / schema
Unique index on `(origin_node, event_id)`; check on `(origin_node, aggregate_id, revision)`.

## Commands / queries / events
Retry rules per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | index down |
| DEDUP.WINDOW_EXCEEDED | true | sync deferral |

## Authorization
Retries re-authorize.

## Failure, idempotency, concurrency, offline
Concurrency via unique index; no offline path.

## Privacy, retention, abuse
Logs carry codes and IDs.

## Observability & budgets
`dedup_failclosed_total`; check p95 ≤ 10 ms (ASSUMPTION).

## Tests
- TEST-PS-087-06-01 (race): 100 concurrent identical checks → one recorded, 99 duplicate.
- TEST-PS-087-06-02 (fault): index outage never returns accepted.
- TEST-PS-087-06-03 (atomic): crash between quarantine and record leaves consistent state.

## Acceptance criteria
1. Race test passes.
2. Fail-closed verified.

## Assumptions & open decisions
- ASSUMPTION: check latency budget.

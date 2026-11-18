# PS-073-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-SCH-001 (R07, R08). **Decisions:** D03, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-06.R01 | Registry events replay deterministically to the same registry state. | MVP |
| PS-073-06.R02 | Clients use last cached entry for each `currency_id` when offline; a new entry is never invented offline. | MVP |
| PS-073-06.R03 | Unknown `currency_id` on a claim while offline is rejected at commit (D08). | MVP |
| PS-073-06.R04 | Registry service outage: reads served from cache up to 24 h; writes fail with `SYS.UNAVAILABLE`. | MVP |

## Data / schema
Cache key `(currency_id, version)`; cache entries immutable.

## Commands / queries / events
Idempotency keys per CTR-EVT-001.

## States & transitions
None beyond PS-073-03.

## Validation & errors
`SYS.UNAVAILABLE` (retryable) for writes during outage.

## Authorization
Unchanged on retry.

## Failure, idempotency, concurrency, offline
Replay of events in revision order.

## Privacy, retention, abuse
Public data; no retention limits beyond registry lifetime.

## Observability & budgets
Cache hit ratio alert below 95% (ASSUMPTION).

## Tests
- TEST-PS-073-06-01 (integration): replay of event log reproduces registry.
- TEST-PS-073-06-02 (integration): outage: reads from cache; writes refused.
- TEST-PS-073-06-03 (negative): offline claim with unknown currency refused at commit.

## Acceptance criteria
1. Replay determinism verified.
2. No invented offline entries.

## Assumptions & open decisions
- ASSUMPTION: 24-hour cache ceiling.
- D03, D08 (PROVISIONAL, unapproved).

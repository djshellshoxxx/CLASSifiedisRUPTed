# PS-018-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-06.R01 | Budget exhaustion discards all candidates from that run; no partial output is ever sent to proposal. | MVP |
| PS-018-06.R02 | Same snapshot and parameters reproduce identical candidates. | MVP |
| PS-018-06.R03 | Run timeout 60 s wall clock (ASSUMPTION), in addition to the step budget. | MVP |
| PS-018-06.R04 | Worker crash restarts the run from the sealed snapshot; no duplicate runs for one key. | MVP |
| PS-018-06.R05 | Lower-length cycles are never produced as fallback when a 5–8 run fails. | MVP |

## Data / schema
Run record and idempotency records (7 days).

## Commands / queries / events
Start is retry-safe by key.

## States & transitions
Failure edges per PS-018-03.

## Validation & errors
Timeouts return CYCLEN.BUDGET_EXHAUSTED (non-retryable with same parameters) or SYS.UNAVAILABLE for infrastructure.

## Authorization
Retries re-check grant.

## Failure, idempotency, concurrency, offline
- Starvation: runs for lengths 5–8 are scheduled round-robin with 3-party and 4-party runs to bound wait time (ASSUMPTION: ≤ 60 s queue wait).
- Backoff for infrastructure failure: 1 s base, 60 s cap, 5 attempts.
- Offline: not applicable.

## Privacy, retention, abuse
Discarded candidates are not written to logs.

## Observability & budgets
Count of budget exhaustion per length.

## Tests
- TEST-PS-018-06-01 (negative): budget set below need yields zero candidates.
- TEST-PS-018-06-02 (property): 100 reruns give identical candidate lists.
- TEST-PS-018-06-03 (integration): crash at 50% progress restarts with identical output.

## Acceptance criteria
1. No partial candidate lists reach proposal in 100% of runs.
2. Reruns identical in 100% of fixtures.
3. Queue wait ≤ 60 s p95 in load test (not yet measured).

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): explicit budget and all-or-nothing output.
- ASSUMPTION: timeout and wait values above.

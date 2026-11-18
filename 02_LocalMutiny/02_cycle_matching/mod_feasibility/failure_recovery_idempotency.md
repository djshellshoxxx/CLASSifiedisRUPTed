# PS-016-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-SCH-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-06.R01 | Same snapshot and parameters always produce the same verdict set (determinism, D02 default). | MVP |
| PS-016-06.R02 | BUDGET_EXHAUSTED is never reported as FEASIBLE; partial results are discarded. | MVP |
| PS-016-06.R03 | If availability or valuation is unreachable, verdict is not produced; UPSTREAM_UNAVAILABLE is returned (retryable). | MVP |
| PS-016-06.R04 | Evaluate hard timeout 10 s; soft target 2 s p95 (ASSUMPTION). | MVP |
| PS-016-06.R05 | Idempotency key = snapshot_id + parameters_digest; retained 7 days (CTR-EVT-001 R03). | MVP |

## Data / schema
Snapshot and verdict records; algorithm_version recorded.

## Commands / queries / events
Evaluate is retry-safe by key. Candidate read is idempotent.

## States & transitions
Failure paths map to PS-016-03: budget → BUDGET_EXHAUSTED; upstream failure → no transition; retry from `generated`.

## Validation & errors
Upstream failures return SYS.UNAVAILABLE or FEASIBLE.UPSTREAM_UNAVAILABLE with retryable true.

## Authorization
Retries re-check evaluator grant (PS-016-05); a revoked grant stops retries.

## Failure, idempotency, concurrency, offline
- Concurrency: two evaluators on one snapshot produce identical verdicts; the second is a no-op by key.
- Recovery: after crash, re-run from sealed snapshot; no proposal state to repair.
- Backoff: 1 s base, 60 s cap, 5 attempts (ASSUMPTION).
- Offline: not applicable; evaluation is server-side.

## Privacy, retention, abuse
Failed snapshots are deleted at expiry, not retained for debugging beyond RET-OPS.

## Observability & budgets
Count of upstream failures and budget exhaustion per hour (PS-016-08).

## Tests
- TEST-PS-016-06-01 (property): 1,000 runs with shuffled edge order give identical verdicts.
- TEST-PS-016-06-02 (negative): budget set to 1 step yields BUDGET_EXHAUSTED, never FEASIBLE.
- TEST-PS-016-06-03 (integration): availability outage yields UPSTREAM_UNAVAILABLE and no verdict.

## Acceptance criteria
1. Determinism holds across shuffled inputs in 100% of runs.
2. No BUDGET_EXHAUSTED candidate is ever routed to consent.
3. Upstream outage produces zero verdicts with false FEASIBLE.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): bounded deterministic search.
- ASSUMPTION: timeout and backoff values above.

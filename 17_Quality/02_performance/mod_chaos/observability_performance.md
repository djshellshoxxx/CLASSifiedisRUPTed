# PS-138-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-08.R01 | Record steady-state metrics before, during and after each experiment at 10 s resolution. | MVP |
| PS-138-08.R02 | Abort on threshold breach within 10 s. | MVP |
| PS-138-08.R03 | Report verdict within 15 min of revert completion. | MVP |
| PS-138-08.R04 | Logs carry no request bodies or tokens. | MVP |

## Data / schema
Labels: `fault_type`, `verdict`, `blast_radius`.

## Commands / queries / events
Each step spans with `experiment_id`.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by SRE and QA Lead.

## Failure, idempotency, concurrency, offline
Monitoring blind spot during fault is treated as abort condition ("no data" for 30 s).

## Privacy, retention, abuse
Telemetry 90 days (ASSUMPTION).

## Observability & budgets
| Signal | Target |
|---|---|
| abort latency | ≤ 10 s |
| revert p95 | ≤ 30 s |
| verdict report | ≤ 15 min after revert |

## Tests
- TEST-PS-138-08-01: integration, abort on synthetic threshold within 10 s.
- TEST-PS-138-08-02: "no data" treated as abort.

## Acceptance criteria
1. Budgets met in 100 drills.
2. Blind-spot abort verified.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D08: PROVISIONAL (D08 default, unapproved).

# PS-136-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-08.R01 | Record cases executed, shrink steps and duration per property. | MVP |
| PS-136-08.R02 | PR property suite ≤ 5 min total (ASSUMPTION). | MVP |
| PS-136-08.R03 | Nightly suite ≤ 60 min total (ASSUMPTION). | MVP |
| PS-136-08.R04 | Alert on any `fail` on the main branch. | MVP |

## Data / schema
Labels: `property`, `outcome`.

## Commands / queries / events
N/A.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by engineers.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
No personal data in telemetry.

## Observability & budgets
| Signal | Target |
|---|---|
| PR suite duration | ≤ 5 min |
| nightly duration | ≤ 60 min |
| case throughput | ≥ 5,000 cases/s for ID generator (ASSUMPTION) |

## Tests
- TEST-PS-136-08-01: performance, PR suite within budget on reference runner.
- TEST-PS-136-08-02: alert on main-branch failure in drill.

## Acceptance criteria
1. Budgets met on three consecutive runs.
2. Main-branch failure alert verified.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D02 (cycle optimizer runtime budget): PROVISIONAL (D02 default, unapproved).

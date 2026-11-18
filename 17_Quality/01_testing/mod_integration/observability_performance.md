# PS-135-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-08.R01 | Record duration per scenario and per step. | MVP |
| PS-135-08.R02 | Full integration suite ≤ 15 min on CI (ASSUMPTION). | MVP |
| PS-135-08.R03 | Flaky rate per scenario reported weekly. | MVP |
| PS-135-08.R04 | Alert when suite duration exceeds budget for 3 consecutive runs. | MVP |

## Data / schema
Labels: `scenario`, `outcome`, `environment_id`.

## Commands / queries / events
Spans per assertion group.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by all engineers.

## Failure, idempotency, concurrency, offline
If dashboards are down, results remain in CI.

## Privacy, retention, abuse
Telemetry contains no fixture content.

## Observability & budgets
| Signal | Target |
|---|---|
| full suite duration | ≤ 15 min |
| single scenario | ≤ 2 min p95 (ASSUMPTION) |
| flaky rate | < 2% per scenario (ASSUMPTION) |

## Tests
- TEST-PS-135-08-01: integration, budget alert fires on synthetic slow run.
- TEST-PS-135-08-02: report, weekly flaky report generated.

## Acceptance criteria
1. Budgets reported on every run.
2. Alert verified.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D08 offline scenario cost: PROVISIONAL (D08 default, unapproved).

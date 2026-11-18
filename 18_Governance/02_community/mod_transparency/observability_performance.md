# PS-148-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-08.R01 | Track days from period end to publication per report; alert at 25 days (ASSUMPTION). | MVP |
| PS-148-08.R02 | Count suppressed cells per metric per report and show the trend to the Privacy Lead. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Draft generation for a quarter, p95 | ≤ 10 min |
| Published report read, p95 | ≤ 300 ms (cached) |
| Publication deadline | ≤ 30 days after period end |

## Logs
Report ID, metric keys, suppressed count. No figure values in logs beyond aggregate counts.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal.
- D05 default applies to region metrics: PROVISIONAL (D05 default, unapproved).

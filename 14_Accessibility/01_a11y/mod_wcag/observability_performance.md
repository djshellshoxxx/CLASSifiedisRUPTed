# PS-111-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-08.R01 | Release dashboard shows open findings by severity and criterion. | MVP |
| PS-111-08.R02 | Gate query p95 ≤ 200 ms. | MVP |
| PS-111-08.R03 | Logs carry record IDs and codes only. | MVP |

## Data / schema
Metrics: `wcag_open_findings{severity}`, `wcag_accepted_risk{days_remaining_bucket}`, `wcag_gate_latency_ms`.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Labels from fixed enums.

## Authorization
Dashboard readable by engineering roles.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
No personal data.

## Observability & budgets
| Budget | Target |
|---|---|
| Gate query p95 | ≤ 200 ms |
| Finding expiry lag | < 1 h (ASSUMPTION) |

## Tests
- TEST-PS-111-08-01 performance: gate query under 1000 findings.
- TEST-PS-111-08-02 static: metric labels are enums.

## Acceptance criteria
1. Dashboard matches gate query in test.
2. Budgets met in performance run.

## Assumptions & open decisions
- ASSUMPTION: dashboard tool PENDING selection under F17.
- No Dxx decision directly affects observability.

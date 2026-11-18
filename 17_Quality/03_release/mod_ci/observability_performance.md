# PS-141-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-08.R01 | Every pipeline run emits duration, queue-wait and per-stage timings. | MVP |
| PS-141-08.R02 | Logs and metrics use an allowlist of fields: run ID, job key, status, duration, runner pool. | MVP |
| PS-141-08.R03 | Flaky-rate and required-check failure rate are reported per branch per week. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| PR pipeline wall time, p95 | ≤ 20 min |
| Queue wait before dispatch, p95 | ≤ 2 min |
| Flake rate on required checks | ≤ 2% of runs per week |
| Run status visible after completion | ≤ 10 s, p95 |

## Metrics and alerts
- Alert: queue wait p95 above budget for one day notifies QA Lead.
- Alert: any secret-pattern rejection notifies Security Lead.
- Dashboards show counts and timings only; no log text.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Tests
- TEST-PS-141-08-01 (performance): PR pipeline p95 wall time measured over 30 runs against budget.
- TEST-PS-141-08-02 (unit): dashboard export contains counts and timings only, no log text.

## Acceptance criteria
1. TEST-PS-141-08-01, TEST-PS-141-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: budgets apply to the default PR pipeline on the trusted pool only.
- No Dxx governs these budgets directly: D07 applies to stored metrics retention: PROVISIONAL (D07 default, unapproved).

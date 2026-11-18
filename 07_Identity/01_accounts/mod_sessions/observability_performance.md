# PS-054-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-08.R01 | Metrics: `session_created_total`, `session_refresh_total{result}`, `session_family_reuse_total`, `session_validation_rejections_total{code}`, `session_active_gauge`. | MVP |
| PS-054-08.R02 | Latency p95: validation ≤ 10 ms (cache hit) and ≤ 30 ms (store); refresh ≤ 50 ms. | MVP |
| PS-054-08.R03 | Alerts: family reuse > 5/h; store unavailable > 1 min; validation p95 > 50 ms for 5 min. | MVP |
| PS-054-08.R04 | Logs carry `ses_` ID and codes only (PS-054-07.R01). | MVP |

## Data / schema
Metric labels bounded; no account or network digest labels.

## Commands / queries / events
Dashboards consume event counts only.

## States & transitions
Metrics per [workflow_state_machine](workflow_state_machine.md) transitions.

## Validation & errors
Rejection counts by code from [validation_rules](validation_rules.md).

## Authorization
Operator dashboard: aggregate only.

## Failure, idempotency, concurrency, offline
Metric failure never blocks validation.

## Privacy, retention, abuse
Metrics retained 90 days; logs RET-OPS.

## Observability & budgets
Log volume ≤ 1 KiB per request. Trace sampling 5% plus 100% on errors.

## Tests
TEST-PS-054-18 (metrics per transition), TEST-PS-054-19 (load: 2 000 validations/s, p95 targets), TEST-PS-054-20 (log redaction scan).

## Acceptance criteria
1. Latency targets met at load profile.
2. Redaction scan clean.

## Assumptions & open decisions
- ASSUMPTION: load profile and alert thresholds.

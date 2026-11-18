# PS-070-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09), CTR-ERR-001 (R10), CTR-CAP-001 (R08). **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-08.R01 | Metrics per command: count, error count by code, p50/p95/p99 latency. | MVP |
| PS-070-08.R02 | Gauge of disputes by status; histogram of `OPEN` → `RESOLVED` duration. | MVP |
| PS-070-08.R03 | Alert when escalation lag exceeds 30 min (PS-070-06). | MVP |
| PS-070-08.R04 | Alert when disputes raised per 100 claims exceeds 5% over 24 h (ASSUMPTION; possible abuse or product fault). | MVP |
| PS-070-08.R05 | Logs and traces carry `dispute_id` and `claim_id` only; never `statement` or evidence content. | MVP |

## Data / schema
Metric labels: `command`, `code`, `status`, `reason_code`. No `acc_` label values.

## Commands / queries / events
No additional events. Metrics derived from `dispute.*` events.

## States & transitions
Not applicable.

## Validation & errors
Error codes as enums only (CTR-ERR-001 R10).

## Authorization
Dashboards: `ope_` read-only role; aggregated counts only.

## Failure, idempotency, concurrency, offline
Metrics pipeline failure never blocks commands. Client telemetry excludes dispute text.

## Privacy, retention, abuse
Logs 30 days (RET-OPS); traces 7 days (ASSUMPTION). Aggregates keep no identifiers.

## Observability & budgets
| Budget | Target |
|---|---|
| `dispute.raise` p95 | ≤ 300 ms |
| `dispute.get` p95 | ≤ 150 ms |
| Escalation lag p95 | ≤ 5 min after due |
| Metrics ingestion lag | ≤ 60 s |

## Tests
- TEST-PS-070-08-01 (integration): latency histograms per command.
- TEST-PS-070-08-02 (negative): log and metric label scan finds no `statement` text.
- TEST-PS-070-08-03 (integration): alert fires when escalation lag exceeds 30 min in drill.
- TEST-PS-070-08-04 (load): 100 raises per second for 10 min meets budget.

## Acceptance criteria
1. Budgets measured in staging before release (later phase).
2. Canary scan clean across logs, traces, metrics.
3. Alert runbook entries exist for R03 and R04 (later phase).

## Assumptions & open decisions
- ASSUMPTION: 5% raise-rate alert threshold; calibrate after pilot data.
- D04 (PROVISIONAL default, unapproved).

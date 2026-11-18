# PS-055-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-08.R01 | Metrics: `portable_exports_total{result}`, `portable_imports_total{result}`, `portable_validation_rejections_total{step,code}`, `portable_partial_files_swept_total`. | MVP |
| PS-055-08.R02 | Latency p95: export generate (≤ 5 MiB profile) ≤ 3 s; import stage ≤ 1 s; apply ≤ 2 s. | MVP |
| PS-055-08.R03 | Alert: any `portable_import` applied on a bundle whose signature key was revoked after `created_at`. | MVP |
| PS-055-08.R04 | Logs: IDs, codes, step names. No bundle bytes, values or subject token. | MVP |

## Data / schema
Metric labels bounded.

## Commands / queries / events
Dashboards read counts only.

## States & transitions
Per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Per [validation_rules](validation_rules.md).

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metrics failure never blocks export or import.

## Privacy, retention, abuse
Metrics 90 days.

## Observability & budgets
Log volume ≤ 1 KiB per request.

## Tests
TEST-PS-055-18 (metrics emitted per transition), TEST-PS-055-19 (latency at 25 MiB bundle), TEST-PS-055-20 (log scan).

## Acceptance criteria
1. Latency targets met in the load profile.
2. Log scan clean.

## Assumptions & open decisions
- ASSUMPTION: alert thresholds and latency budgets.

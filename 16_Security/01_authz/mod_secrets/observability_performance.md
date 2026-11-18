# PS-127-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-08.R01 | Metrics: `secrets_leases_issued_total{requester_module}`, `secrets_lease_latency_ms`, `secrets_kms_errors_total`, `secrets_rotations_stuck`. | MVP |
| PS-127-08.R02 | Alert: rotation stuck > 24 h; KMS error rate > 1% for 5 min; lease rate anomaly. | MVP |
| PS-127-08.R03 | `lease.issue` p95 <= 50 ms (ASSUMPTION). | MVP |
| PS-127-08.R04 | Audit records: 100% of lease and admin events (CTR-CAP-001 R08). | MVP |

## Data / schema
Labels: `requester_module`, `status`, `code` (enums).

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Dashboard per PS-127-05 R03.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
No values or lease tokens in telemetry (PS-127-07).

## Observability & budgets
Budgets in R03.

## Tests
- TEST-PS-127-08-01 (unit): alerts fire at thresholds.
- TEST-PS-127-08-02 (performance): lease latency p95 under load meets R03.
- TEST-PS-127-08-03 (log scan): no tokens in telemetry.
- TEST-PS-127-08-04 (audit): every lease produces an `aud_` record.

## Acceptance criteria
1. Audit completeness 100% in test (TEST-04).
2. TEST-PS-127-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: lease latency budget.

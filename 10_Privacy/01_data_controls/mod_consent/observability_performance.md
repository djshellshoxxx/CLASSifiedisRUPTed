# PS-076-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-08.R01 | Consent check p95 ≤ 20 ms server-side (ASSUMPTION). | MVP |
| PS-076-08.R02 | Withdrawal propagation lag to downstream consumers p95 ≤ 60 s (ASSUMPTION). | MVP |
| PS-076-08.R03 | Metrics and logs contain pseudonymous IDs and enum values only. | MVP |
| PS-076-08.R04 | Alert when any consent check returns "granted" for a subject with a withdrawn record in the same purpose (correctness alarm). | MVP |

## Data / schema
Metric labels limited to `purpose`, `outcome`, `code`. No `acc_` label on metrics (cardinality and privacy).

## Commands / queries / events
Observability consumes `consent.*` events (file 04) and check results.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failures never block consent writes.

## Authorization
Dashboards readable by Privacy Lead and on-call operators; no content visible.

## Failure, idempotency, concurrency, offline
If telemetry is unavailable, consent processing continues; events are queued in the platform pipeline.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION). Log redaction tests cover `subject`, `scope.ref`.

## Observability & budgets
| Metric | Type | Labels | Target |
|---|---|---|---|
| consent_checks_total | counter | purpose, outcome | — |
| consent_check_latency_ms | histogram | purpose | p95 ≤ 20 ms |
| consent_propagation_lag_s | histogram | purpose | p95 ≤ 60 s |
| consent_stale_grant_alarm_total | counter | purpose | must be 0 |

## Tests
- TEST-PS-076-08-01 (performance): 1,000 checks/s fixture meets p95 target.
- TEST-PS-076-08-02 (redaction): log output contains no `acc_` or `scope.ref` values.
- TEST-PS-076-08-03 (alarm): seeded stale grant triggers R04 alarm.

## Acceptance criteria
1. All four metrics exported.
2. Redaction test passes.
3. Alarm test passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above pending F10 and F15 validation.
- PROVISIONAL (D08 default, unapproved) affects propagation SLO.

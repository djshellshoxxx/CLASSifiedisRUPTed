# PS-129-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-08.R01 | Expose gauge `crypto_policy_active_total{key_class}`; value must be exactly 1 per class. | MVP |
| PS-129-08.R02 | Expose `crypto_policy_rotation_age_days{key_class}`; alert at 80% of `rotation_days`. | MVP |
| PS-129-08.R03 | Read p95 ≤ 50 ms; command p95 ≤ 500 ms (ASSUMPTION). | MVP |
| PS-129-08.R04 | Logs redact nothing beyond IDs because none are sensitive; key material is never logged (CTR-PRV-001 R08). | MVP |

## Data / schema
Metrics labels: `key_class`, `rule`, `event_type`. No label carries a user identifier.

## Commands / queries / events
Each command emits a trace span with `command_version` and error code.

## States & transitions
Dashboards show state counts per status.

## Validation & errors
Alerts route to Security Lead (F16) on-call.

## Authorization
Metrics readable by `ope` with `read` at global scope.

## Failure, idempotency, concurrency, offline
If metrics are unavailable, commands still run; alert on absence of gauge for 5 min.

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION).

## Observability & budgets
| Signal | Target |
|---|---|
| read p95 | ≤ 50 ms |
| command p95 | ≤ 500 ms |
| activation lag p95 | ≤ 120 s |
| zero-active alert | ≤ 5 min |

## Tests
- TEST-PS-129-08-01: integration, gauge equals 1 after activation.
- TEST-PS-129-08-02: load, read p95 within budget at 200 rps (ASSUMPTION).

## Acceptance criteria
1. Each signal in the budget table has a dashboard panel and alert rule.
2. No log line contains key material in a sample of 10,000 lines.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D10 rotation alerts: PROVISIONAL (D10 default, unapproved).

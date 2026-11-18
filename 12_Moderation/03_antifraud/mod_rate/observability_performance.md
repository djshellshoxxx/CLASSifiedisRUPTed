# PS-099-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-08.R01 | Metrics carry `class_id`, `decision`, `policy_version` and `caller` labels only. No subject labels. | MVP |
| PS-099-08.R02 | `rate.consume` p95 ≤ 5 ms in-process. | MVP |
| PS-099-08.R03 | Fallback activation detected and alerted within 60 s. | MVP |
| PS-099-08.R04 | Denial-rate baseline per class computed on a rolling 7-day window. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `rate_decision_total` | counter | `class_id`, `decision` (allow, limited) |
| `rate_fallback_total` | counter | `class_id` |
| `rate_store_latency_seconds` | histogram | none |
| `rate_policy_version` | gauge | `policy_version` |
| `rate_authz_denied_total` | counter | `caller` |

## Commands / queries / events
Denials emit spans with class and retry time; allows are sampled at 1 %.

## States & transitions
Dashboard shows per-class denial ratio and fallback state.

## Validation & errors
`rate_validation_error_total{code}`.

## Authorization
Dashboards: operations role; class-level only.

## Failure, idempotency, concurrency, offline
Alerts per PS-099-06 (fallback > 5 min; denial spike 5× baseline for 10 min).

## Privacy, retention, abuse
Metrics and spans never include subject tokens, IPs or account IDs.

## Observability & budgets
Store capacity alarm at 80 % of 10 million live keys (PS-099-01 R05).

## Tests
- `TEST-PS-099-08-01` load: 50 000 consumes/s for 10 min, p95 ≤ 5 ms in-process.
- `TEST-PS-099-08-02` contract: label set check.
- `TEST-PS-099-08-03` alert: forced fallback pages within 60 s.
- `TEST-PS-099-08-04` log scan: no subject token strings.

## Acceptance criteria
1. Metrics and alerts documented and tested.
2. Latency budget met in benchmark.
3. Log scan finds zero subject identifiers.

## Assumptions & open decisions
- ASSUMPTION: 50 000 consumes/s is the reference-node estimate.
- D07 (retention), PROVISIONAL default applies to metric retention (unapproved).

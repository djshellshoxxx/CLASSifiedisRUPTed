# PS-098-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R04, R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-08.R01 | Metrics carry no `acc_`, `lim_` or cell-level labels finer than the registered region cell. | MVP |
| PS-098-08.R02 | `limits.check` p95 ≤ 50 ms; p99 ≤ 200 ms. | MVP |
| PS-098-08.R03 | Decision log lag p95 ≤ 5 s; any `dec_` missing after 60 s raises an alert. | MVP |
| PS-098-08.R04 | Published quota-denial aggregates by region cell only when the cell passes K_MIN (CTR-PRV-001 R04). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `limits_check_latency_seconds` | histogram | `quota_key` |
| `limits_decision_total` | counter | `quota_key`, `outcome` |
| `limits_quota_exceeded_total` | counter | `quota_key`, `policy_version` |
| `limits_policy_cache_age_seconds` | gauge | `owner_module` |
| `limits_decision_log_lag_seconds` | histogram | none |

## Commands / queries / events
Span `limits.check` with `quota_key`, `policy_version`, outcome.

## States & transitions
Dashboard: active policies and rollout percentages.

## Validation & errors
`limits_validation_error_total{code}`.

## Authorization
Dashboards: `ope_` aggregate scope.

## Failure, idempotency, concurrency, offline
Alerts: check p99 > 200 ms for 5 min (page); decision log lag > 60 s (page); policy cache age > 45 min (ticket).

## Privacy, retention, abuse
Aggregates only. Region-cell denial metrics suppressed when below K_MIN = 5 (CTR-PRV-001 R04).

## Observability & budgets
Capacity: 2 000 checks per second per node at launch (ASSUMPTION).

## Tests
- `TEST-PS-098-08-01` load: 2 000 checks/s for 10 min, p95 ≤ 50 ms.
- `TEST-PS-098-08-02` contract: no account label in metrics.
- `TEST-PS-098-08-03` privacy: aggregate below K_MIN not published.
- `TEST-PS-098-08-04` alert: forced decision-log lag fires page.

## Acceptance criteria
1. Latency budgets met in load test.
2. Metric label sets reviewed and documented.
3. K_MIN suppression verified.

## Assumptions & open decisions
- ASSUMPTION: capacity and latency targets are reference-node estimates.
- D07 (retention), PROVISIONAL default governs metric retention (unapproved).

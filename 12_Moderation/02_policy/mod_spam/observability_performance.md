# PS-097-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-08.R01 | Metrics carry no `spm_id`, `lst_`, `acc_` or message identifiers as labels. | MVP |
| PS-097-08.R02 | Evaluate p95 ≤ 200 ms (listings), ≤ 50 ms (message metadata). | MVP |
| PS-097-08.R03 | Listing pending-evaluation time p95 ≤ 60 s; p99 ≤ 15 min. | MVP |
| PS-097-08.R04 | Precision and recall estimates from reviewer labels reported weekly per model version. | MVP |
| PS-097-08.R05 | Per-language false positive rate reported monthly (F14). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `spam_evaluate_latency_seconds` | histogram | `subject_type` |
| `spam_verdict_total` | counter | `decision`, `reason_code`, `model_version` |
| `spam_quarantine_age_seconds` | gauge | none |
| `spam_evaluation_backlog_seconds` | gauge | `subject_type` |
| `spam_throttle_total` | counter | none |

## Commands / queries / events
Spans `spam.evaluate` with `model_version`, `subject_type`, outcome code (no IDs).

## States & transitions
Dashboard counts per state; quarantine age histogram.

## Validation & errors
`spam_validation_error_total{code}`.

## Authorization
Dashboards: `ope_` and Trust&Safety role, aggregate only.

## Failure, idempotency, concurrency, offline
Alerts: backlog > 15 min for listings (page); false-positive rate increase > 2× baseline per locale (ticket); scorer error rate > 5 % for 5 min (page).

## Privacy, retention, abuse
No content or feature values in metrics; sampling of evaluations for human review uses pseudonymous IDs and stays within case scope.

## Observability & budgets
Model evaluation budget ≤ 10 ms CPU median for listings (ASSUMPTION). Storage ≤ 0.5 KB per verdict.

## Tests
- `TEST-PS-097-08-01` load: 100 listing evaluations/s for 10 min meet R02.
- `TEST-PS-097-08-02` contract: metric label set has no identifiers.
- `TEST-PS-097-08-03` alert: 20 min backlog triggers page in staging.
- `TEST-PS-097-08-04` log scan: canary strings absent.

## Acceptance criteria
1. All metrics documented with label sets.
2. Latency and backlog budgets met in staging.
3. Quality reports generated for two consecutive weeks in staging.

## Assumptions & open decisions
- ASSUMPTION: budgets are reference-node estimates.
- D07 (retention), PROVISIONAL default governs metric and label-report retention (unapproved).

# PS-092-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-08.R01 | Metrics carry no `apl_id`, `acc_` or `mod_` labels. | MVP |
| PS-092-08.R02 | Submit and decide command p95 ≤ 300 ms; `appeal.get` p95 ≤ 150 ms. | MVP |
| PS-092-08.R03 | Time to decision: p50 ≤ 5 days, p95 ≤ 14 days (matches SLA, ASSUMPTION). | MVP |
| PS-092-08.R04 | Backlog alert when any `decided` appeal lacks `implemented` after 24 h. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `appeals_transition_total` | counter | `from`, `to` |
| `appeals_time_to_decision_seconds` | histogram | `target_type` |
| `appeals_decision_total` | counter | `decision_code`, `target_type` |
| `appeals_validation_error_total` | counter | `code` |
| `appeals_backlog_age_seconds` | gauge | none |

Reversal rate = `REVERSED` ÷ all decisions, per `target_type`, reviewed monthly by F12 (not an alert).

## Commands / queries / events
Spans `appeals.<command>` with `request_id`, outcome code and duration.

## States & transitions
Dashboards show counts per state; no per-appeal drill-down outside the case view.

## Validation & errors
`appeals_validation_error_total{code}` only; no body length in metrics.

## Authorization
Dashboards require `ope_` with aggregate scope; no per-case data.

## Failure, idempotency, concurrency, offline
Alert on `appeals_backlog_age_seconds` > 86 400 for 1 h. Alert on submit error rate > 2 % for 10 min (ASSUMPTION).

## Privacy, retention, abuse
Logs and traces: IDs and codes only; body is never sampled into traces (CTR-PRV-001 R09). Histogram buckets prevent single-appeal re-identification (minimum bucket count 5, ASSUMPTION).

## Observability & budgets
Capacity target: 1 000 appeals per day per node at launch (ASSUMPTION); storage ≤ 2 KB per appeal excluding body.

## Tests
- `TEST-PS-092-08-01` load: 10 submits/s and 10 decides/s for 10 min meet R02.
- `TEST-PS-092-08-02` contract: no metric label matches `apl_`, `acc_`, `mod_`.
- `TEST-PS-092-08-03` log scan: no body text after an end-to-end run.
- `TEST-PS-092-08-04` alert: synthetic 25 h backlog fires backlog alert.

## Acceptance criteria
1. All five metrics exposed with documented labels.
2. Latency and alert requirements pass in staging.
3. Log scan zero forbidden fields.

## Assumptions & open decisions
- ASSUMPTION: capacity and bucket thresholds are estimates pending F15 review.
- D07 (retention), PROVISIONAL default applies to metric and log retention (unapproved).

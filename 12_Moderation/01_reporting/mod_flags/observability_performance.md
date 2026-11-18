# PS-094-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-08.R01 | Metrics per command, per reason and per triage outcome. | MVP |
| PS-094-08.R02 | Logs contain report_id, codes and timings only. | MVP |
| PS-094-08.R03 | Volume anomaly alerts fire within 5 min. | MVP |

## Metrics
| Metric | Type | Labels |
|---|---|---|
| reports_submitted_total | counter | reason_code, outcome |
| flags_dedupe_hits_total | counter | none |
| flags_queue_age_seconds | histogram | reason_code |
| flags_threshold_crossings_total | counter | target_type |
| flags_threshold_lag_seconds | histogram | none |
| flags_triage_outcomes_total | counter | outcome |

## Budgets
| Operation | p95 | Basis |
|---|---|---|
| report.submit (excl. evidence) | ≤ 300 ms | ASSUMPTION |
| report.triage_queue (50 rows) | ≤ 400 ms | ASSUMPTION |
| Queue age, standard reasons | ≤ 24 h | ASSUMPTION |
| Queue age, threat_or_violence, doxxing_or_personal_data | ≤ 1 h | ASSUMPTION |

## Alerts
- Reports on one target > 10 in 10 min (brigading candidate).
- Reports per reason > 3σ over 7-day baseline.
- Threshold lag > 60 s.
- Any reporter identity in non-case logs or responses.

## Log redaction
Logs exclude detail_text, reporter_ref and target content. Target IDs are logged only as prefix plus hash prefix (8 chars).

## Privacy, retention, abuse
Dashboards show counts, not identities. Per-target panels are case-scoped.

## Failure, idempotency, concurrency, offline
Metric emission failure does not block submit. Counters reconcile daily from `rpt_` store.

## Authorization
Dashboards readable by `ope`; per-target drill-down requires case grant.

## Tests
- TEST-PS-094-08-01 (logs): submit produces log lines with no detail_text or reporter_ref.
- TEST-PS-094-08-02 (alert): simulated brigading fires alert within 5 min.
- TEST-PS-094-08-03 (load): 200 submits/s burst meets submit budget.

## Acceptance criteria
1. Every metric in the table exists with stated labels.
2. No log or metric label contains a user or target identifier in clear.

## Assumptions & open decisions
- ASSUMPTION: budgets validated in F15 load test.
- PROVISIONAL (D07 default, unapproved): operational logs RET-OPS 30 days.

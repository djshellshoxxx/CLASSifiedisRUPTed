# PS-095-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-08.R01 | Per-rule precision and volume published daily. | MVP |
| PS-095-08.R02 | Logs carry rule_id, category and counts only. | MVP |
| PS-095-08.R03 | Precision falls below threshold → rule auto-proposed for suspension to governance within 1 h. | MVP |

## Metrics
| Metric | Type | Labels |
|---|---|---|
| abuse_findings_total | counter | category, status |
| abuse_rule_precision | gauge (daily) | rule_id |
| abuse_scan_lag_seconds | histogram | none |
| abuse_scan_backlog | gauge | none |
| abuse_deadletter_total | counter | none |
| abuse_misuse_candidates_total | counter | none |

## Budgets
| Operation | p95 | Basis |
|---|---|---|
| Scan per 16 KiB window | ≤ 20 ms | ASSUMPTION |
| Scan lag from write | ≤ 60 s | ASSUMPTION |
| Review queue load | ≤ 400 ms | ASSUMPTION |

## Alerts
- Scan lag > 60 s for 10 min.
- Backlog > 10,000.
- Precision < 0.4 for 7 days on any rule.
- Any matched text or digest in logs (zero tolerance).

## Log redaction
Logs and traces exclude request bodies and matched spans (CTR-ERR-001 R10).

## Privacy, retention, abuse
Dashboards show category and rule counts only; per-subject views are case-scoped.

## Failure, idempotency, concurrency, offline
Metric loss does not change decisions. Precision is recomputed from the store, not from counters.

## Authorization
`ope` read on aggregates; no text access.

## Tests
- TEST-PS-095-08-01 (logs): scan logs contain rule_id only.
- TEST-PS-095-08-02 (alert): forced low precision triggers governance proposal within 1 h.
- TEST-PS-095-08-03 (load): 1,000 posts/min scan within lag budget.

## Acceptance criteria
1. Every metric in the table emitted with stated labels.
2. Logs contain no content (privacy scan).

## Assumptions & open decisions
- ASSUMPTION: budgets validated by F15 load test.
- PROVISIONAL (D07 default, unapproved): RET-OPS 30 days for operational logs.

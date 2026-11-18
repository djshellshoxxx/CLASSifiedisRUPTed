# PS-133-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-08.R01 | Register dashboard shows counts by status, framework and area, refreshed at least hourly | MVP |
| PS-133-08.R02 | Overdue reviews and unverified controls are reported per area; both targets 0 | MVP |
| PS-133-08.R03 | Logs contain THR-IDs, codes and actor roles only; description and rationale text excluded | MVP |
| PS-133-08.R04 | Register read p95 <= 300 ms and write p95 <= 300 ms at 500 threats | MVP |

## Data / schema
Metric records: `{area_path, status, framework, count, at}`. No free-text fields.

## Commands / queries / events
Emits `threats.ReviewOverdue` daily per overdue threat (deduplicated per threat_id per day).

## States & transitions
Not applicable.

## Validation & errors
Metric emission failure is logged as THREATS.METRIC_UNAVAILABLE (retryable); register writes are not blocked.

## Authorization
Dashboards: Security Lead, Privacy Lead, auditor. Area owners see their own area counts only.

## Failure, idempotency, concurrency, offline
Metric export idempotent per hour bucket. Dashboard stale-data banner when last refresh > 2 h.

## Privacy, retention, abuse
Metrics contain no restricted fields. Log lines pass redaction filter listing banned keys: description, detail_ref, rationale.

## Observability & budgets
| Metric | Target |
|---|---|
| overdue reviews | 0 |
| controls unverified > 30 days | 0 |
| read/write p95 | <= 300 ms |
| mean time identified to assessed | <= 10 business days (ASSUMPTION) |

## Tests
- TEST-PS-133-08-01 (unit): metric record contains only permitted keys (schema test).
- TEST-PS-133-08-02 (integration): threat with review_due passed produces one ReviewOverdue per day.
- TEST-PS-133-08-03 (unit): log line for AcceptResidual contains no rationale text.

## Acceptance criteria
1. Dashboard matches register counts in fixture run (100% match).
2. No description or rationale text in logs for sampled 1,000 lines.
3. Latency targets measured on fixture with 500 threats.

## Assumptions & open decisions
- ASSUMPTION: 500-threat scale is an upper bound for MVP.
- No D-number directly applies; retention of logs follows D07 PROVISIONAL.

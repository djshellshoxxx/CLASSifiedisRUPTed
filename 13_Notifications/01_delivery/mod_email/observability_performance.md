# PS-102-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09), CTR-ERR-001 (R10), CTR-EVT-001.

**Decision labels:** Budgets are ASSUMPTION, PROVISIONAL (D07 default, unapproved; Platform Lead to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-08.R01 | Counters: `email_sent_total{template_id}`, `email_rejected_total{code}`, `email_bounce_total{type}`, `email_complaint_total`. | MVP |
| PS-102-08.R02 | Gauges: `email_queue_depth`, `email_queue_oldest_age_seconds`, `email_breaker_state`. | MVP |
| PS-102-08.R03 | Logs carry IDs, template ID, code and timing only. No address, token or body. | MVP |
| PS-102-08.R04 | Metric labels use closed sets (templates from catalog; unknown → `other`). | MVP |
| PS-102-08.R05 | Traces carry `correlation_id` and provider latency; never recipient data. | MVP |

## Data / schema
Metric label values are catalog-bound. Log schema: `ts`, `module`, `event`, `email_id`, `dlv_id`, `code`, `duration_ms`.

## Commands / queries / events
Each command and event increments one counter.

## States & transitions
Queue age measured from `QUEUED` to `SENT`.

## Validation & errors
Rejected counts by code.

## Authorization
Dashboards are restricted to Platform Lead and on-call operators; no per-account view.

## Failure, idempotency, concurrency, offline
Metric failure never blocks send. Offline: not applicable.

## Privacy, retention, abuse
Metrics retained 30 days; logs 30 days (RET-OPS). Bounce rate by template is the only per-template breakdown.

## Observability and budgets
| Budget | Target | Status |
|---|---|---|
| Bind request p95 (excluding provider) | ≤ 300 ms | ASSUMPTION |
| Verify request p95 | ≤ 200 ms | ASSUMPTION |
| Queue to provider acceptance p95 | ≤ 60 s | ASSUMPTION |
| Sustained send throughput | 50 messages/s per node | ASSUMPTION |

Alerts: hard bounce rate > 2% over 1 hour; complaint rate > 0.1% over 24 hours (ASSUMPTION; provider policy thresholds apply if stricter); breaker open > 5 minutes.

## Tests
- TEST-PS-102-23 (integration): counters increment once per accepted command.
- TEST-PS-102-24 (negative): log scan finds no address or token.
- TEST-PS-102-25 (load): 50 messages/s for 10 minutes meets queue budget.

## Acceptance criteria
1. Alert rules configured and tested with synthetic bounce.
2. Log scan clean in CI.
3. Load budget met or revised through Platform Lead review.

## Assumptions & open decisions
- ASSUMPTION: provider exposes delivery, bounce and complaint webhooks.
- D07 (PROVISIONAL, unapproved).

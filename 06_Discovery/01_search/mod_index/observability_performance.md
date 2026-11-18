# PS-045-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R09); PENDING CTR-DSC-001.

**Decision labels:** Performance budgets are ASSUMPTION (F15 to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-08.R01 | Emit `index_lag_seconds` histogram per source event type; p95 ≤ 60 s, p99 ≤ 300 s. | MVP |
| PS-045-08.R02 | Emit DLQ depth, revision-gap count and rebuild progress gauges. | MVP |
| PS-045-08.R03 | Logs carry `listing_id`, `revision`, `code`, `correlation_id` only; no titles, tokens or regions with counts below K_MIN. | MVP |
| PS-045-08.R04 | Apply path p95 ≤ 200 ms; query exclusion after suppression ≤ 60 s. | MVP |
| PS-045-08.R05 | Dashboards and alerts documented per metric with owner role (Platform Lead). | MVP |

## Data / schema
Metric names: `index_lag_seconds`, `index_apply_latency_ms`, `index_dlq_depth`, `index_revision_gap_total`, `index_rebuild_docs_per_s`, `index_redacted_tokens_total`. Labels limited to `event_type`, `code`, `status`; no `listing_id` labels (cardinality and privacy).

## Commands / queries / events
Traces propagate `correlation_id` (`cor_`) across `apply_event`, `suppress` and `rebuild`.

## States & transitions
Alert state transitions: `ok → warn (p95 > 60 s for 10 min) → page (p95 > 300 s for 10 min)`.

## Validation & errors
Validation error counts reported by code (PS-045-02), not by content.

## Authorization
Dashboards readable by `ope_` roles only; per-region aggregate counts require K_MIN.

## Failure, idempotency, concurrency, offline
Metrics pipeline outage must not block apply. Buffered local metrics capped at 10 MB and dropped oldest-first (ASSUMPTION).

## Privacy, retention, abuse
Metrics retained RET-OPS (30 days). Log lines redacted by allowlist, not denylist.

## Observability & budgets
Budgets: lag p95 ≤ 60 s; apply p95 ≤ 200 ms; rebuild ≥ 500 docs/s on reference node (ASSUMPTION); query exclusion ≤ 60 s.

## Tests
- TEST-PS-045-08-01 (unit): log formatter rejects a title field (redaction allowlist).
- TEST-PS-045-08-02 (load): 1 000 events/s apply holds p95 ≤ 200 ms.
- TEST-PS-045-08-03 (integration): alert fires when injected lag exceeds 300 s.

## Acceptance criteria
1. All six metrics exposed and documented.
2. Log sample of 10 000 lines contains no listing title or token.
3. Load test meets latency budgets on reference profile (profile to be fixed by F15).

## Assumptions & open decisions
- ASSUMPTION: reference node profile not yet defined (PENDING F15).

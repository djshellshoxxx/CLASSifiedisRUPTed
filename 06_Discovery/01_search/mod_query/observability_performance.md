# PS-046-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09); PENDING CTR-DSC-001.

**Decision labels:** Budgets are ASSUMPTION (F15 to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-08.R01 | `discovery.search` p95 ≤ 150 ms server-side; p99 ≤ 400 ms. | MVP |
| PS-046-08.R02 | Metrics: `query_latency_ms`, `query_zero_result_ratio`, `query_error_total{code}`, `query_rate_limited_total`. | MVP |
| PS-046-08.R03 | Labels never include text, cursor or principal ID. | MVP |
| PS-046-08.R04 | Zero-result rate alert when > 40% over 30 min for a cell with ≥ 5 queries (ASSUMPTION). | MVP |

## Data / schema
Metric labels: `code`, `state`, `principal_type`, `region_cell` only where cell count ≥ K_MIN in the window.

## Commands / queries / events
Trace spans per state in PS-046-03; `correlation_id` (`cor_`) generated per request.

## States & transitions
Latency split per state for diagnosis.

## Validation & errors
Error counters keyed by code only.

## Authorization
Dashboards readable by Platform Lead roles; cell-level dashboards require K_MIN.

## Failure, idempotency, concurrency, offline
Telemetry loss does not block search; buffer ≤ 10 MB, drop oldest.

## Privacy, retention, abuse
Metrics retained 30 days (RET-OPS). Zero-result queries are not logged with text.

## Observability & budgets
p95 150 ms, p99 400 ms, error budget 0.5% over 30 days (ASSUMPTION).

## Tests
- TEST-PS-046-08-01 (load): 500 req/s holds p95 ≤ 150 ms on reference profile.
- TEST-PS-046-08-02 (unit): metric label allowlist rejects text label.
- TEST-PS-046-08-03 (integration): zero-result alert fires with injected data.

## Acceptance criteria
1. Four metrics exposed with documented labels.
2. Load test passes budgets at reference profile (PENDING F15 profile).
3. Log sample of 10 000 search lines has no text or cursor.

## Assumptions & open decisions
- ASSUMPTION: reference profile undefined (PENDING F15).

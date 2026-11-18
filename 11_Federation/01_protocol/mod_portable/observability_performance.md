# PS-083-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-FED-001 (R10, R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-08.R01 | Bundle build p95 ≤ 2 s for 1000 items (ASSUMPTION). | MVP |
| PS-083-08.R02 | Import verification p95 ≤ 500 ms for 100 events (ASSUMPTION). | MVP |
| PS-083-08.R03 | Metrics contain no `acc_` or `nod_` values as labels; use hashed node class labels. | MVP |

## Data / schema
Labels: `code`, `outcome`, `item_count_bucket`.

## Commands / queries / events
Consumes `bundle.*` events.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failures do not block builds.

## Authorization
Dashboards visible to Platform Lead and on-call.

## Failure, idempotency, concurrency, offline
Metrics loss tolerated.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| portable_build_latency_ms p95 | ≤ 2000 |
| portable_import_verify_ms p95 | ≤ 500 |
| portable_import_rejections_total | tracked by code |

## Tests
- TEST-PS-083-08-01 (performance): 1000-item fixture meets build p95.
- TEST-PS-083-08-02 (redaction): labels contain no IDs.
- TEST-PS-083-08-03 (metric): rejection increments by code.

## Acceptance criteria
1. Metrics exported.
2. Redaction passes.
3. Budgets verified on fixtures.

## Assumptions & open decisions
- ASSUMPTION: budgets above.

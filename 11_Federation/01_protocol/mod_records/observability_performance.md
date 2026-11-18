# PS-084-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-08.R01 | Flag change p95 ≤ 150 ms (ASSUMPTION). | MVP |
| PS-084-08.R02 | Count of federated items per registry type exported daily. | MVP |
| PS-084-08.R03 | Labels exclude item and owner IDs. | MVP |

## Data / schema
Labels: `record_type`, `outcome`, `code`.

## Commands / queries / events
Consumes `record.*` events.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure never blocks flag changes.

## Authorization
Platform Lead dashboards.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| records_flag_latency_ms p95 | ≤ 150 |
| records_federated_items{record_type} | tracked |

## Tests
- TEST-PS-084-08-01 (performance): fixture meets p95.
- TEST-PS-084-08-02 (redaction): no IDs in labels.

## Acceptance criteria
1. Metrics exported.
2. Redaction passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above.

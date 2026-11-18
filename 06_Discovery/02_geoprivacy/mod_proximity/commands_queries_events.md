# PS-045-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

**Decision labels:** D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-04.R01 | `proximity.query` is a read; it writes only the budget counter (RET-EPH). | MVP |
| PS-045-04.R02 | Query p95 ≤ 100 ms (ASSUMPTION) for ring 2 (≤ 19 cells). | MVP |
| PS-045-04.R03 | Registry changes emit `cell.*` events with `max_data_class = LOCATION_COARSE`. | MVP |
| PS-045-04.R04 | Events never include active counts below K_MIN. | MVP |

## Data / schema
`proximity.query` request: `cell_id`, `ring`. Response: list of `{cell_id, ring_distance, count_bucket}`, plus `budget_remaining`. Counts are buckets (`5-9`, `10-24`, `25+`), not exact values (ASSUMPTION).

## Commands / queries / events
| Command or query | Caller | Event | Error codes |
|---|---|---|---|
| `proximity.query` (query) | anonymous or session | none (budget counter only) | RING_TOO_LARGE, PRECISE_CENTER_REJECTED, CELL_UNKNOWN, QUERY_BUDGET_EXCEEDED |
| `cell.register` | registry admin | cell.registered | SYS.FORBIDDEN, SYS.CONFLICT |
| `cell.refresh` (system) | system | cell.published / cell.merged_up / cell.suppressed | SYS.UNAVAILABLE |

## States & transitions
Per PS-045-03.

## Validation & errors
PS-045-02 gates.

## Authorization
PS-045-05.

## Failure, idempotency, concurrency, offline
Refresh idempotent per cycle. Query degrades to last published snapshot (≤ 30 min old) with `stale: true`.

## Privacy, retention, abuse
Events carry cell IDs and states only. No query input stored.

## Observability & budgets
`proximity_query_latency_ms`; `proximity_query_total{outcome}`.

## Tests
- TEST-PS-045-04-01 (contract): query and event schemas validate.
- TEST-PS-045-04-02 (query purity): query writes no record except budget counter.
- TEST-PS-045-04-03 (K_MIN): response includes no bucket for cells below 5.
- TEST-PS-045-04-04 (budget): 19-cell ring 2 query meets p95 ≤ 100 ms on fixture.

## Acceptance criteria
1. Query stores no input (TEST-PS-045-04-02).
2. No sub-K_MIN counts in responses or events.
3. Latency budget met.

## Assumptions & open decisions
- ASSUMPTION: 100 ms p95 target; bucket boundaries.
- PENDING CTR-SCH-001 registration of cell and proximity response schemas.

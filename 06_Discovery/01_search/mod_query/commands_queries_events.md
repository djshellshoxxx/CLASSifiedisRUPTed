# PS-046-04 — queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R13 for read audit exclusion), CTR-ERR-001, CTR-ID-001, CTR-SCH-001; PENDING CTR-DSC-001.

**Decision labels:** None directly; read-path events are aggregate-only (ASSUMPTION).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-04.R01 | `discovery.search` is read-only and emits no domain event. | MVP |
| PS-046-04.R02 | Only aggregate counters are emitted (`search.executed` aggregate, per cell and hour, K_MIN applied). | MVP |
| PS-046-04.R03 | Responses are versioned by `api_version` (`1.x`); unknown major → `SCH.UNKNOWN_VERSION`. | MVP |

## Data / schema
| Name | Kind | Signature | Idempotency | Version | Errors |
|---|---|---|---|---|---|
| `discovery.search` | query | `(SearchRequest) → SearchPage` | not applicable (read) | 1.0.0 | QUERY.*, SYS.RATE_LIMITED, SYS.NOT_FOUND |
| `discovery.search.aggregate` | event (aggregate) | `{cell, hour_bucket, executed_count, zero_result_count}` | n/a | 1.0.0 | n/a |

Aggregate event suppresses any cell with executed_count < 5 (K_MIN, CTR-PRV-001 R04).

## States & transitions
Not applicable; see PS-046-03.

## Validation & errors
See PS-046-02.

## Authorization
See PS-046-05.

## Failure, idempotency, concurrency, offline
Read retries are safe. Aggregate emission is best-effort, buffered ≤ 1 h.

## Privacy, retention, abuse
No per-request event. Aggregate counters retained RET-OPS (30 days).

## Observability & budgets
Latency p95 ≤ 150 ms for `discovery.search` (ASSUMPTION).

## Tests
- TEST-PS-046-04-01 (contract): `discovery.search` schema matches registry.
- TEST-PS-046-04-02 (unit): aggregate for a cell with 4 executions is suppressed.
- TEST-PS-046-04-03 (contract): no domain event produced by a search request.

## Acceptance criteria
1. Search produces zero domain events (test asserts over 10 000 requests).
2. Aggregate suppression verified at boundary 4 and 5.

## Assumptions & open decisions
- ASSUMPTION: aggregate granularity of 1 hour per cell.

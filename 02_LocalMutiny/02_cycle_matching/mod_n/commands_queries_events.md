# PS-018-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-04.R01 | `cycle.search_n` is idempotent by (snapshot_id, parameters_digest). | MVP |
| PS-018-04.R02 | `cycle.search_n` returns the run ID immediately; results are read with `cycle_search.get`. | MVP |
| PS-018-04.R03 | `cycle_search.get` returns candidates to the matcher only; participants see only their own proposals. | MVP |
| PS-018-04.R04 | Event `aggregate_type` `cycle_search`; revision per run. | MVP |

## Data / schema
Request: `{snapshot_id, parameters: {max_length, budget_steps, candidate_cap}, idempotency_key}`. Event: `cycle_search.completed {run_id, status, truncated, candidate_count}`.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected revision | Errors |
|---|---|---|---|---|
| cycle.search_n | sys_ matcher | snapshot + digest | null | CYCLEN.LENGTH_OUT_OF_RANGE, CYCLEN.ROUTED_ELSEWHERE, CYCLEN.SNAPSHOT_NOT_SEALED |
| cycle_search.get | sys_ matcher | n/a | n/a | SYS.NOT_FOUND |

Versioning: schema 1.0.0; algorithm version in payload.

## States & transitions
PS-018-03.

## Validation & errors
PS-018-02.

## Authorization
PS-018-05.

## Failure, idempotency, concurrency, offline
Retry rules in PS-018-06.

## Privacy, retention, abuse
Event payload carries counts, not candidate content.

## Observability & budgets
Event lag ≤ 5 s p95.

## Tests
- TEST-PS-018-04-01 (contract): event validates.
- TEST-PS-018-04-02 (unit): repeated search with same digest returns same run ID.
- TEST-PS-018-04-03 (negative): user call to cycle.search_n denied.

## Acceptance criteria
1. Each operation has schema, caller, idempotency rule and errors.
2. Event carries counts only.
3. Repeated identical requests create one run.

## Assumptions & open decisions
- PENDING CTR-EVT-001 subscriber map for mod_party and mod_consent.

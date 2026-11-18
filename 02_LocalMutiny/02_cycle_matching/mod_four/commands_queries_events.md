# PS-017-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-04.R01 | All writes carry `idempotency_key` and `expected_version` (cycle version). | MVP |
| PS-017-04.R02 | `cycle.consent` accepts `{cycle_id, slot_index, expected_version, idempotency_key}`. | MVP |
| PS-017-04.R03 | `cycle.get` returns the full slot list to participants only; non-participants receive SYS.NOT_FOUND. | MVP |
| PS-017-04.R04 | Event `aggregate_type` is `cycle`; revisions are contiguous per cycle. | MVP |

## Data / schema
Requests: `cycle.propose_four {feasibility_ref, idempotency_key}`; `cycle.consent {cycle_id, slot_index, expected_version, idempotency_key}`; `cycle.decline {cycle_id, slot_index, expected_version, idempotency_key}`.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected version | Errors |
|---|---|---|---|---|
| cycle.propose_four | sys_ matcher | feasibility_ref + key | null | CYCFOUR.NOT_FEASIBLE, CYCFOUR.LENGTH_MISMATCH, CYCFOUR.VALUE_GAP |
| cycle.consent | slot participant | key | required | SYS.CONFLICT (stale version), CYCFOUR.STALE_VERDICT |
| cycle.decline | slot participant | key | required | SYS.CONFLICT |
| cycle.get | participant | n/a | n/a | SYS.NOT_FOUND |

Events: cycle.proposed, cycle.slot_consented, cycle.version_superseded, cycle.consented, cycle.declined, cycle.expired. Schema 1.0.0.

## States & transitions
Mapping in PS-017-03.

## Validation & errors
PS-017-02.

## Authorization
PS-017-05.

## Failure, idempotency, concurrency, offline
Concurrency token is `expected_version`; replay rules in PS-017-06.

## Privacy, retention, abuse
Events show pseudonymous slot refs only.

## Observability & budgets
Consent latency p95 ≤ 300 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-017-04-01 (contract): each event validates.
- TEST-PS-017-04-02 (unit): stale expected_version rejected with SYS.CONFLICT.
- TEST-PS-017-04-03 (negative): consent by a non-slot participant is denied.

## Acceptance criteria
1. Every command has schema, idempotency and expected-version rule.
2. Events are emitted once per committed transition.
3. `cycle.get` never returns another party's offer details beyond the four slot summaries.

## Assumptions & open decisions
- ASSUMPTION: 300 ms p95 consent budget.
- PENDING CTR-EVT-001 subscriber map for mod_lock and mod_n.

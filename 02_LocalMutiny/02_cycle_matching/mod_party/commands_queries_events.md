# PS-019-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-04.R01 | Writes carry `idempotency_key` and `expected_version`. | MVP |
| PS-019-04.R02 | `cycle.bind_slot` takes `{cycle_id, par_id, slot_index, cycle_version, idempotency_key}`. | MVP |
| PS-019-04.R03 | `cycle.withdraw_slot` takes `{cycle_id, par_id, expected_version, idempotency_key}`. | MVP |
| PS-019-04.R04 | `cycle.slots_get` returns the caller's slot and counts for other slots, no other refs. | MVP |

## Data / schema
Events: `cycle.slot_bound`, `cycle.slot_withdrawn`, `cycle.slot_status_changed`, payload = binding record (PS-019-01). `max_data_class` PSEUDONYMOUS.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected version | Errors |
|---|---|---|---|---|
| cycle.bind_slot | sys_ cycle creator | key | cycle version | CYCPARTY.SLOT_TAKEN, CYCPARTY.INDEX_OUT_OF_RANGE, CYCPARTY.VERSION_STALE |
| cycle.withdraw_slot | slot participant | key | cycle version | CYCPARTY.LOCKED, CYCPARTY.VERSION_STALE |
| cycle.slots_get | participant | n/a | n/a | SYS.NOT_FOUND |

Schema 1.0.0; a MAJOR change requires a migration plan (CTR-SCH-001 R07).

## States & transitions
PS-019-03.

## Validation & errors
PS-019-02.

## Authorization
PS-019-05.

## Failure, idempotency, concurrency, offline
Same-key replay returns original result (CTR-EVT-001 R03).

## Privacy, retention, abuse
No free text in any command.

## Observability & budgets
Bind p95 ≤ 150 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-019-04-01 (contract): events validate.
- TEST-PS-019-04-02 (unit): replay of bind with same key returns original.
- TEST-PS-019-04-03 (negative): withdraw by non-participant denied.

## Acceptance criteria
1. Every command has schema, idempotency and version rule.
2. Slots view reveals no other participant's ref.
3. Event revisions contiguous per cycle.

## Assumptions & open decisions
- ASSUMPTION: 150 ms p95 bind budget.

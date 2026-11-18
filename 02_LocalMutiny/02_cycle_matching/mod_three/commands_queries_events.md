# PS-020-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-04.R01 | Writes carry `idempotency_key` and `expected_version`. | MVP |
| PS-020-04.R02 | `cycle.propose_three` takes `{feasibility_ref, idempotency_key}`. | MVP |
| PS-020-04.R03 | `cycle.consent` and `cycle.decline` take `{cycle_id, slot_index, expected_version, idempotency_key}`. | MVP |
| PS-020-04.R04 | `cycle.get` returns the three slot summaries to participants only. | MVP |

## Data / schema
Events of aggregate `cycle`; schema 1.0.0; payload = cycle record.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected version | Errors |
|---|---|---|---|---|
| cycle.propose_three | sys_ matcher | feasibility_ref + key | null | CYCTHREE.NOT_FEASIBLE, LENGTH_MISMATCH, LISTING_LOCKED |
| cycle.consent | slot participant | key | required | SYS.CONFLICT, CYCTHREE.STALE_VERDICT |
| cycle.decline | slot participant | key | required | SYS.CONFLICT |
| cycle.get | participant | n/a | n/a | SYS.NOT_FOUND |

## States & transitions
PS-020-03.

## Validation & errors
PS-020-02.

## Authorization
PS-020-05.

## Failure, idempotency, concurrency, offline
PS-020-06.

## Privacy, retention, abuse
Events show pseudonyms only.

## Observability & budgets
Consent latency p95 ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-020-04-01 (contract): events validate.
- TEST-PS-020-04-02 (unit): replay returns original result.
- TEST-PS-020-04-03 (negative): decline by non-slot denied.

## Acceptance criteria
1. Each command has schema, idempotency and version rule.
2. `cycle.get` reveals only the three slot summaries.
3. Revisions contiguous per cycle.

## Assumptions & open decisions
- ASSUMPTION: 300 ms p95 consent budget.

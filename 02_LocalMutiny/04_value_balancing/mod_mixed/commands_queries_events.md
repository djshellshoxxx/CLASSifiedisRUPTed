# PS-026-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-COM-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-04.R01 | Every state-changing command carries `idempotency_key` (≥ 16 chars) and `expected_revision` (CTR-EVT-001 R02, R03). | MVP |
| PS-026-04.R02 | Commands ≤ 16 KB body. Query responses for one revision ≤ 64 KB. | MVP |
| PS-026-04.R03 | Every event is a CTR-EVT-001 envelope with `aggregate_type` = `cycle` and `max_data_class` = FINANCIAL_EVIDENCE. | MVP |
| PS-026-04.R04 | Every payload is registered in CTR-SCH-001 under the `schema_id` below. | MVP |

## Data / schema
| Command | Signature | Idempotency key | Version |
|---|---|---|---|
| `mixed.leg.declare` | (`cyc_`, expected_revision, legs[1..8]) → revision N+1 | (actor, command, key) | 1.0.0 |
| `mixed.leg.withdraw` | (`cyc_`, expected_revision, leg_index) | (actor, command, key) | 1.0.0 |
| `mixed.leg.submit_claim` | (`cyc_`, leg_index) → `clm_` | (actor, command, key) | 1.0.0 |
| `mixed.leg.attest` | (`clm_`, claim_hash, signature) → forwarded to `clm.attest` | (actor, command, key) | 1.0.0 |

Query: `mixed.leg.list(cyc_, revision)` returns legs visible to the caller (PS-026-05). Pagination: none; a revision has ≤ 8 legs.

## Commands / queries / events
| Event (`schema_id`) | Emitted by | Payload summary |
|---|---|---|
| `mixed.leg.declared` | declare | cyc_, revision, leg_count |
| `mixed.leg.withdrawn` | withdraw | cyc_, revision, leg_index |
| `mixed.leg.claim_submitted` | submit_claim | cyc_, leg_index, clm_ |
| `mixed.leg.unattested` | timer | cyc_, leg_index |

Error codes per command: PS-026-02 table, plus `SYS.CONFLICT` (409) on `expected_revision` mismatch and `MIXED.LEG_STATE_INVALID` (PS-026-03).

## States & transitions
Command-to-state mapping is defined in PS-026-03. Commands are rejected, not queued, when the aggregate is in a terminal state.

## Validation & errors
Schema validation (JSON Schema 2020-12) runs before PS-026-02 business rules. Unknown fields are rejected in commands (`SYS.REQUEST_MALFORMED`).

## Authorization
Actions are listed in PS-026-05. Authorization runs before schema validation so that unauthorized actors learn nothing about rule failures.

## Failure, idempotency, concurrency, offline
Duplicate command with the same key and digest returns the original result. Same key with a different digest returns `SYS.CONFLICT`. Event delivery is at-least-once; consumers dedupe by `event_id`.

## Privacy, retention, abuse
Events carry no description text for in-kind legs; only `leg_index`. Subscribers receive the minimum payload their PS-026-05 scope allows.

## Observability & budgets
Command p95 ≤ 300 ms server side (ASSUMPTION). Event lag to subscribers p95 ≤ 2 s.

## Tests
- TEST-PS-026-04-01 (contract): every command and event validates against its CTR-SCH-001 schema.
- TEST-PS-026-04-02 (integration): duplicate `mixed.leg.declare` returns identical revision.
- TEST-PS-026-04-03 (integration): stale `expected_revision` returns `SYS.CONFLICT` with no write.
- TEST-PS-026-04-04 (contract): `mixed.leg.declared` payload contains no amount field.

## Acceptance criteria
1. All four commands and four events registered; lint passes.
2. Replay test: same key yields same result; different digest yields conflict.
3. No event payload contains amount, currency or description (PRIVATE/FINANCIAL data stay in the aggregate).

## Assumptions & open decisions
- ASSUMPTION: idempotency retention 24 h, then key rejected as `SYS.GONE`.
- Schema IDs follow CTR-SCH-001 `schema_id` rules. See [DECISIONS.md](../../../DECISIONS.md) D04 (PROVISIONAL default).

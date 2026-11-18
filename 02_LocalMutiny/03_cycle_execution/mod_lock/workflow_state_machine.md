# PS-023-03 — Workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-03.R01 | Item lock states: `REQUESTED`, `HELD`, `RELEASED`, `EXPIRED`, `CONSUMED`. Terminal: RELEASED, EXPIRED, CONSUMED. | MVP |
| PS-023-03.R02 | Lock set acquisition is all-or-nothing: if any item fails, every HELD item of the set is released in the same request. | MVP |
| PS-023-03.R03 | Acquisition order is ascending `item_id` (deadlock avoidance). | MVP |
| PS-023-03.R04 | CONSUMED is set only when the cycle reaches COMPLETED (all parties' claims at ≥ COUNTERPARTY_ATTESTED per CTR-COM-001). | MVP |
| PS-023-03.R05 | Transitions emit one CTR-EVT-001 event each with `revision` increment. | MVP |

## Data / schema
State stored in `item_lock.state`; per-cycle projection `cycle_lock_set_state` (HELD_ALL, PARTIAL, RELEASED, EXPIRED, CONSUMED) derived from members.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `item.lock_requested` | PS-023-02 valid | REQUESTED | start acquisition |
| REQUESTED | `item.locked` | availability check and unique index insert succeed | HELD | fence assigned |
| REQUESTED | `item.lock_failed` | any item unavailable | (none; all REQUESTED rolled back) | `CYC_LOCK.ITEM_UNAVAILABLE` to caller |
| HELD | `item.lock_released` | fence valid; reason = dropout or cancel | RELEASED | notify mod_dropouts |
| HELD | `item.lock_expired` | now ≥ expires_at | EXPIRED | cycle → PARTIAL or EXPIRED |
| HELD | `item.lock_consumed` | cycle COMPLETED (R04) | CONSUMED | availability decremented by F01 via event |
| HELD | `item.lock_extended` | extensions = 0 and ≤ 48 h | HELD | expires_at updated |

## Validation & errors
Guards per [validation_rules.md](validation_rules.md). Invalid transitions → `SYS.UNPROCESSABLE_STATE`.

## Authorization
System principal `sys_` performs all transitions; participants read only.

## Failure, idempotency, concurrency, offline
Expiry and release transitions are idempotent on (`lock_id`, `fence`). Partial acquisition cleanup runs inside the same request; leftover REQUESTED rows older than 60 s are swept to RELEASED by a reconciler.

## Privacy, retention, abuse
Events carry `item_id` and `fence` only; no owner identity to non-participants.

## Observability & budgets
Gauge per state; sweep count per minute (should be zero in steady state).

## Tests
- TEST-PS-023-03-01 (unit): each transition in the table.
- TEST-PS-023-03-02 (integration): one item unavailable in an 8-item set releases the other seven.
- TEST-PS-023-03-03 (property): CONSUMED reached only after COMPLETED.

## Acceptance criteria
1. Transitions match the table.
2. No HELD item remains after a failed acquisition (checked over 10 000 random failures).
3. CONSUMED never precedes cycle completion.

## Assumptions & open decisions
- ASSUMPTION: 60 s sweep threshold for REQUESTED rows.
- [DECISIONS.md](../../../DECISIONS.md) D04 — PROVISIONAL (D04 default, unapproved): a lock is a reservation, not evidence of transfer.

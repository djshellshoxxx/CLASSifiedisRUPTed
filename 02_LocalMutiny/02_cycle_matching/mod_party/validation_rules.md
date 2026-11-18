# PS-019-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001. Module code `CYCPARTY` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-02.R01 | `par_` must exist, belong to the caller's proposal flow, and be in `pending` at the source (F02.S01.M02). | MVP |
| PS-019-02.R02 | `slot_index` must be in 0..(cycle length − 1). | MVP |
| PS-019-02.R03 | `expected_version` must equal the cycle's current version. | MVP |
| PS-019-02.R04 | Participant may not hold another live slot (R02 of PS-019-01). | MVP |
| PS-019-02.R05 | Withdrawal is allowed only before lock, or after lock through PS-024 recovery only. | MVP |

## Data / schema
Rule parameters: `max_cycle_length=8` (from PS-018), live-status set as in PS-019-01.

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCPARTY.SLOT_TAKEN | unprocessable_state (422) | false | participant has another live slot | live_slot |
| CYCPARTY.INDEX_OUT_OF_RANGE | validation (400) | false | slot_index outside cycle | slot_index |
| CYCPARTY.VERSION_STALE | conflict (409) | true | expected_version ≠ current | expected_version |
| CYCPARTY.PAR_NOT_PENDING | unprocessable_state (422) | false | par_ not pending at source | par_status |
| CYCPARTY.LOCKED | unprocessable_state (422) | false | withdrawal of locked slot outside recovery | lock_status |

Messages: `err.cycparty.<code>`; no values echoed.

## Authorization
Validation runs after PS-019-05 checks.

## Failure, idempotency, concurrency, offline
Deterministic for the same binding state.

## Privacy, retention, abuse
Errors carry no slot pseudonyms of other participants.

## Observability & budgets
Rejection counts per code.

## Tests
- TEST-PS-019-02-01 (unit): one fixture per code.
- TEST-PS-019-02-02 (negative): second live slot attempt returns SLOT_TAKEN.
- TEST-PS-019-02-03 (boundary): index N−1 accepted, N refused.

## Acceptance criteria
1. Each code produced only by its trigger.
2. Live-slot rule holds under concurrent binds (see PS-019-06).
3. No other participant's ref appears in errors.

## Assumptions & open decisions
- ASSUMPTION: one live slot per participant.
- PROVISIONAL (D04 default, unapproved).

# PS-014-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-02.R01 | An invitation is accepted only when the `prf_` is an active view of the invitee `acc_` at accept time. | MVP |
| PS-014-02.R02 | A `region_cell_id` is accepted only if it is in the registry and has at least K_MIN active items (CTR-PRV-001 R04). | MVP |
| PS-014-02.R03 | Slot count and index rules (PS-014-01 R02) are checked at cycle creation and at each invite. | MVP |
| PS-014-02.R04 | Pseudonym switch after accept is refused for the rest of the cycle. | MVP |

## Data / schema
Errors: `code` = `PARTY.<CODE>`; `message_key` = `err.party.<code>`; field paths as JSON pointers.

## Commands / queries / events
Applies to `party.invite`, `party.accept`, `party.decline`, `party.withdraw` (PS-014-04).

## States & transitions
Validation only. Rules R01 and R04 run at accept; R02 runs at accept and at each region change while `invited`.

## Validation & errors
| Code | Retryable | Rule |
|---|---|---|
| PARTY.SLOT_LIMIT | false | slot count outside 2–6 |
| PARTY.DUPLICATE_MEMBER | false | same `acc_` already in cycle (R05 of PS-014-01) |
| PARTY.NOT_INVITED | false | caller holds no `invited` slot |
| PARTY.ALREADY_RESOLVED | false | slot not in `invited` state |
| PARTY.PSEUDONYM_INACTIVE | false | `prf_` not active for caller |
| PARTY.PSEUDONYM_SWITCH | false | R04 violated |
| PARTY.REGION_NOT_REGISTERED | false | R02, cell unknown |
| PARTY.REGION_BELOW_THRESHOLD | true | R02, cell below K_MIN; retry after count changes |
| PARTY.REMOVED | false | slot removed by case or suspension |

## Authorization
Authorization check precedes validation; foreign slot IDs return `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Deterministic on a snapshot. Concurrent accept and decline on one slot: first commit wins.

## Privacy, retention, abuse
Errors never reveal another party's `acc_` or `prf_` (CTR-ERR-001 R06–R08).

## Observability & budgets
Counts per code. Validation ≤ 20 ms p95.

## Tests
- TEST-PS-014-02-01 (unit): each code on minimal fixture.
- TEST-PS-014-02-02 (integration): region cell drops below K_MIN between invite and accept → BELOW_THRESHOLD.
- TEST-PS-014-02-03 (security): non-invitee gets `SYS.NOT_FOUND` for the slot.

## Acceptance criteria
1. Every code has a fixture and a message key.
2. No error body contains `acc_` or `prf_` values of other parties.

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 (F10 to validate).
- D05 PROVISIONAL (Dxx default, unapproved): coarse regions only.

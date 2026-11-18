# PS-043-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001, CTR-COM-001 (no custody).

**Decision labels:** D04 OPEN. D09 PROVISIONAL (deposit release handled by deposits module). Window values ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-03.R01 | Status set exactly DUE, OVERDUE, DECLARED, OWNER_CONFIRMED, DAMAGE_OPEN, CLOSED. | MVP |
| PS-043-03.R02 | Silence from the owner is not confirmation. At owner window close with no owner action, the record closes with `OWNER_WINDOW_CLOSED` and does not confirm no-issue. | MVP |
| PS-043-03.R03 | On CLOSED, the module requests deposit release. It never releases money or confirms the deposit. | MVP |
| PS-043-03.R04 | Late declaration is allowed and recorded; it moves OVERDUE → DECLARED without any automatic charge. | MVP |
| PS-043-03.R05 | Any other transition → `RETURN.INVALID_TRANSITION` (409). | MVP |

## Data / schema
Each event increments `state_version` by 1; no in-place status updates.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | rental_return.created | rental reaches end time | DUE | Notify renter |
| DUE | rental_return.overdue | `due_at` passed, no declaration | OVERDUE | Reminder; no charge |
| DUE, OVERDUE | rental_return.declared | renter declaration valid | DECLARED | Notify owner; start 7-day window |
| DECLARED | rental_return.confirmed | owner confirms, `owner_result = NO_ISSUE` | OWNER_CONFIRMED | Notify renter |
| DECLARED | rental_return.damage_opened | owner reports `dmg_` | DAMAGE_OPEN | Link `damage_ids` |
| OWNER_CONFIRMED | rental_return.closed | system | CLOSED (BOTH_CONFIRMED_NO_ISSUE) | Deposit release request |
| DECLARED | rental_return.closed | 7-day window ends, no owner action | CLOSED (OWNER_WINDOW_CLOSED) | Deposit release request (owner attest still required there) |
| DAMAGE_OPEN | rental_return.closed | all linked `dmg_` terminal | CLOSED (DAMAGE_RESOLVED) | Deposit request with agreed lines |
| DUE, OVERDUE, DECLARED | rental_return.cancelled | rental cancelled | CLOSED (CANCELLED) | Notify both |

## States & transitions
Terminal: CLOSED. Forbidden pairs return R05.

## Validation & errors
`RETURN.INVALID_TRANSITION` (409); `RETURN.ALREADY_CLOSED` (409).

## Authorization
Renter declares; owner confirms or opens damage; system closes.

## Failure, idempotency, concurrency, offline
Timers (overdue, owner window) run as idempotent `sys` jobs keyed by `(return_id, state_version)`. Revision check on writes.

## Privacy, retention, abuse
History is PRIVATE_PERSONAL; RET-PRIV.

## Observability & budgets
`return_transitions_total{from,to}`; `return_owner_window_closed_total`. Alert if owner-window closures exceed 30% of returns in 30 days (ASSUMPTION).

## Tests
- TEST-PS-043-03-01 (state): every table row passes; others return R05.
- TEST-PS-043-03-02 (timer): no owner action for 7 days → OWNER_WINDOW_CLOSED, not OWNER_CONFIRMED.
- TEST-PS-043-03-03 (late): late declaration moves OVERDUE → DECLARED with `late_minutes` > 0 and no charge event.
- TEST-PS-043-03-04 (damage): DAMAGE_OPEN closes only after every linked damage is terminal.

## Acceptance criteria
1. No path reaches OWNER_CONFIRMED without an owner action (TEST-PS-043-03-02).
2. Late returns never trigger a charge automatically (TEST-PS-043-03-03).
3. Every transition emits exactly one event.

## Assumptions & open decisions
- ASSUMPTION: 7-day owner window; F05 confirms (OPEN).
- OPEN (D04): compensation if the item is returned to the wrong party.

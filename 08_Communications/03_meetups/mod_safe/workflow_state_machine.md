# PS-066-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R13), CTR-ERR-001. **Decisions:** D05, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-03.R01 | States: `PROPOSED`, `CONFIRMED`, `ACTIVE`, `CHECKED_IN`, `CHECKED_OUT`, `SAFE_EXIT`, `CANCELLED`, `EXPIRED`. No other state exists. | MVP |
| PS-066-03.R02 | `CHECKED_OUT`, `SAFE_EXIT`, `CANCELLED`, `EXPIRED` are terminal. | MVP |
| PS-066-03.R03 | Safe exit is accepted from `ACTIVE` or `CHECKED_IN` by either party, with no reason field. | MVP |
| PS-066-03.R04 | No transition is triggered by device location. | MVP |
| PS-066-03.R05 | Each transition appends one event with incremented `revision`. | MVP |

## Data / schema
Transition row: `meetup_plan_id`, `from_status`, `event`, `to_status`, `revision`, `actor_ref`, `recorded_at`.

## Commands / queries / events
Events listed in PS-066-04. Timer events are emitted by a `sys_` principal.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `meetup.propose` | PS-066-02 passes | `PROPOSED` | Counterparty gets generic "meetup request" notice |
| PROPOSED | `meetup.confirm` | actor is other party; `now` < `window_end` | `CONFIRMED` | Both parties receive window |
| PROPOSED | `meetup.cancel` | actor is a party | `CANCELLED` | Notice |
| PROPOSED | timer: `window_start - 2 h` reached | not confirmed | `EXPIRED` | Notice |
| CONFIRMED | `meetup.cancel` | `now` < `window_start` | `CANCELLED` | Notice |
| CONFIRMED | timer: `window_start` | — | `ACTIVE` | Check-in becomes available |
| ACTIVE | `meetup.check_in` (first party) | code valid, in window | `ACTIVE` | Party flag set |
| ACTIVE | `meetup.check_in` (second party) | code valid, in window | `CHECKED_IN` | Both notified |
| CHECKED_IN | `meetup.check_out` | actor is party | `CHECKED_OUT` | Both notified |
| ACTIVE, CHECKED_IN | `meetup.safe_exit` | actor is party | `SAFE_EXIT` | Counterparty sees "meetup ended" only |
| ACTIVE | timer: `window_end + 30 min` | no check-out | `EXPIRED` | Label "not confirmed complete" |

Any other pair returns `SAFE.INVALID_TRANSITION` (conflict / 409).

## Validation & errors
`SAFE.INVALID_TRANSITION` for pairs outside the table. Timer races: the timer re-reads `revision` and no-ops if the state changed.

## Authorization
Party-only events. Timers are `sys_`. No moderator transition exists in this module.

## Failure, idempotency, concurrency, offline
Concurrent check-in and safe exit: first committed wins; the second gets `SYS.CONFLICT` and re-reads. Timer jobs may run up to 5 min late and are idempotent.

## Privacy, retention, abuse
State log holds enums and revisions only.

## Observability & budgets
Gauge: plans per state. Histogram: time from `CONFIRMED` to `CHECKED_IN` (aggregate only).

## Tests
- TEST-PS-066-03-01 (unit): every table row passes; all other from/event pairs return `SAFE.INVALID_TRANSITION`.
- TEST-PS-066-03-02 (property): 10,000 random event sequences never reach a state outside R01 and never leave a terminal state.
- TEST-PS-066-03-03 (integration): simultaneous check-in and safe exit yield exactly one winner.
- TEST-PS-066-03-04 (integration): timer delayed 5 min still produces `EXPIRED` once.

## Acceptance criteria
1. Transition table matches the implementation exactly (generated test).
2. Safe exit produces no reason field in any notification (test).
3. No transition depends on location input (static check).

## Assumptions & open decisions
- ASSUMPTION: 2-hour confirmation deadline; 30-minute grace after window end.
- D08 (PROVISIONAL default, unapproved): offline events queue locally until relay acknowledgment.

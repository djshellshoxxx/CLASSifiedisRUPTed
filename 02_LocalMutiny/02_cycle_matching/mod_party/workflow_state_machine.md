# PS-019-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-03.R01 | Slot status is one of pending, consented, declined, withdrawn, dropped, locked, compensated. | MVP |
| PS-019-03.R02 | `locked` and `compensated` are reached only from cycle lock and PS-024 recovery events. | MVP |
| PS-019-03.R03 | Withdrawal before lock frees the participant's live slot in the same commit. | MVP |
| PS-019-03.R04 | Every change emits one event with the cycle `correlation_id`. | MVP |

## Data / schema
Status in `binding.status`; history is the event stream.

## Commands / queries / events
Transitions via PS-019-04 or upstream events.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cycle.bind_slot | PS-019-02 passes | pending | emit cycle.slot_bound |
| pending | mod_consent: consented | version matches | consented | emit cycle.slot_status_changed |
| pending or consented | cycle.withdraw_slot | not locked | withdrawn | frees live slot; cycle superseded |
| pending | dropout detected (mod_dropouts) | — | dropped | cycle back to proposed |
| consented | cycle locked | all slots consented | locked | emit status change |
| locked | recovery compensates | PS-024 plan | compensated | releases live slot |
| pending | cycle expired | 48 h window | declined | frees live slot |

## Validation & errors
Invalid transitions return SYS.UNPROCESSABLE_STATE or CYCPARTY codes.

## Authorization
Withdraw: slot participant. Bind: cycle creator (sys_). Lock and compensate: system events only.

## Failure, idempotency, concurrency, offline
Serialised on binding version; see PS-019-06.

## Privacy, retention, abuse
Withdrawal reason is not stored (no free text).

## Observability & budgets
Count of withdrawals after consent (abuse signal).

## Tests
- TEST-PS-019-03-01 (unit): every table row.
- TEST-PS-019-03-02 (property): live slot count never exceeds one per participant.
- TEST-PS-019-03-03 (integration): withdraw before lock frees slot for next cycle.

## Acceptance criteria
1. Status changes match table rows in 100% of runs.
2. Withdrawal releases the live slot in the same commit.
3. No `locked` without a lock event.

## Assumptions & open decisions
- PROVISIONAL (D04 default, unapproved).

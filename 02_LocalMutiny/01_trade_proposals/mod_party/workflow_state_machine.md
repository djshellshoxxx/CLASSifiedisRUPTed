# PS-014-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-03.R01 | Slot status changes only via the table below; other pairs return `PARTY.ILLEGAL_TRANSITION`. | MVP |
| PS-014-03.R02 | A slot leaves `invited` no later than the cycle expiry (default 72 h from cycle proposal; max 7 days). | MVP |
| PS-014-03.R03 | Each transition emits one CTR-EVT-001 event in the same commit. | MVP |
| PS-014-03.R04 | The cycle (`mod_two`) becomes fully accepted only when every slot is `accepted`. | MVP |

## Data / schema
`status` enum per PS-014-01. Terminal: `declined`, `withdrawn`, `removed`, `expired`.

## Commands / queries / events
Commands in PS-014-04. Events: `party.invited`, `party.accepted`, `party.declined`, `party.withdrawn`, `party.removed`, `party.expired`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | party.invite | cycle in `draft`; slot count ≤ 6 | invited | emit invited |
| invited | party.accept | PS-014-02 R01–R04 pass | accepted | emit accepted; notify cycle |
| invited | party.decline | caller = `acc_` of slot | declined | emit declined; cycle → closed if ≥1 declined |
| invited | clock | now ≥ cycle expiry | expired | emit expired |
| invited | case removal (F12) | `case:` scope | removed | emit removed |
| accepted | party.withdraw | caller = `acc_`; cycle not locked | withdrawn | emit withdrawn; cycle → closed |
| accepted | case removal (F12) | `case:` scope | removed | emit removed |
| accepted | cycle.locked | mod_two lock | accepted (frozen) | no further edits |

## Validation & errors
`PARTY.ILLEGAL_TRANSITION` (not retryable); `PARTY.ALREADY_RESOLVED` on repeated accept.

## Authorization
Transitions require the actor in PS-014-05. Removal requires `mod_` case scope.

## Failure, idempotency, concurrency, offline
Transition and event commit atomically under the slot lock. Accept vs expiry race: first commit wins.

## Privacy, retention, abuse
State history kept with slot (PS-014-07). Removal reason stored as code only.

## Observability & budgets
Transition counters; expiry sweep lag ≤ 60 s.

## Tests
- TEST-PS-014-03-01 (unit): exhaustive table test.
- TEST-PS-014-03-02 (integration): accept vs expiry race yields one outcome.
- TEST-PS-014-03-03 (integration): fully accepted cycle is reported only when all slots accepted.

## Acceptance criteria
1. Model-based coverage 100% of (state, event) pairs.
2. No slot leaves `accepted` after lock in fuzzing of 10,000 sequences.

## Assumptions & open decisions
- ASSUMPTION: a single decline closes the cycle in MVP (no replacement invite).
- D04 OPEN: partial acceptance and recovery rules are deferred to F02.S03.

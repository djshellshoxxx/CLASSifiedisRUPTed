# PS-013-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-03.R01 | Exactly one status per revision; transitions table below is exhaustive. Any other transition returns `OFFER.ILLEGAL_TRANSITION`. | MVP |
| PS-013-03.R02 | No transition out of `locked` except to `closed`. Edits to a locked offer return `OFFER.IMMUTABLE`. | MVP |
| PS-013-03.R03 | Each transition emits one CTR-EVT-001 event in the same commit as the state change. | MVP |
| PS-013-03.R04 | `expired` is applied by a scheduled sweep no later than 60 s after `expires_at` (ASSUMPTION). | MVP |

## Data / schema
`status` enum per PS-013-01. Terminal states: `withdrawn`, `expired`, `superseded`, `closed`.

## Commands / queries / events
Commands in PS-013-04. Events: `offer.submitted`, `offer.superseded`, `offer.withdrawn`, `offer.expired`, `offer.locked`, `offer.closed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| draft | offer.submit | PS-013-02 passes; slot `par_` status = accepted | submitted | emit submitted |
| submitted | offer.submit (new revision) | same slot; revision_no + 1 | superseded (prior) | emit superseded; new row submitted |
| submitted | offer.withdraw | caller = slot `acc_` | withdrawn | emit withdrawn |
| submitted | clock | now ≥ expires_at | expired | emit expired |
| submitted | cycle.locked (F02.S01.M01) | R02 re-check passes | locked | digest frozen; emit locked |
| submitted | cycle.closed | cycle ended before lock | closed | emit closed |
| locked | cycle.closed | cycle executed or cancelled | closed | emit closed |
| draft | offer.discard | caller = slot `acc_` | (deleted) | no event; draft only |

## Validation & errors
Illegal transitions: `OFFER.ILLEGAL_TRANSITION` (not retryable). Edit when locked: `OFFER.IMMUTABLE`.

## Authorization
Transitions require the actor in PS-013-05; `cycle.*` events are system-only (`sys_`).

## Failure, idempotency, concurrency, offline
Transition and event commit in one transaction under the row lock. Lock vs withdraw race: first committed wins; loser receives `OFFER.ILLEGAL_TRANSITION`. See PS-013-06.

## Privacy, retention, abuse
State history retained with the revision (PS-013-07). No state change depends on counterparty content.

## Observability & budgets
Histogram of time in `submitted`; counter per transition. Sweep lag p95 ≤ 60 s.

## Tests
- TEST-PS-013-03-01 (unit): all table rows pass; every other (state, event) pair returns ILLEGAL_TRANSITION.
- TEST-PS-013-03-02 (integration): lock vs withdraw race yields exactly one winner.
- TEST-PS-013-03-03 (integration): expiry sweep applies within 60 s of `expires_at`.

## Acceptance criteria
1. Transition table is exhaustive: model-based test covers 100% of (state, event) pairs.
2. Zero locked offers changed by property-based fuzzing over 10,000 sequences.

## Assumptions & open decisions
- ASSUMPTION: `cycle.*` events originate only from F02.S01.M01 (mod_two).
- D08 PROVISIONAL (Dxx default, unapproved): offline submits queue locally until acknowledged (PS-013-06).

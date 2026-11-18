# PS-015-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-03.R01 | Only the transitions below are legal; others return `TWO.ILLEGAL_TRANSITION`. | MVP |
| PS-015-03.R02 | `fully_accepted` enters a 15-minute confirmation window (`confirming`) during which any slot may withdraw. Lock occurs after the window. | MVP |
| PS-015-03.R03 | Each transition emits one event in the same commit (CTR-EVT-001 R03). | MVP |
| PS-015-03.R04 | `locked` is terminal for withdrawal; only `closed` follows. | MVP |

## Data / schema
Status enum per PS-015-01.

## Commands / queries / events
Events: `cycle.proposed`, `cycle.fully_accepted`, `cycle.confirming`, `cycle.locked`, `cycle.declined`, `cycle.withdrawn`, `cycle.expired`, `cycle.closed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| draft | cycle.propose | PS-015-02 R01 | proposed | invites issued via PS-014 |
| proposed | slot accepted and offer submitted (all slots) | R02 except feasibility | fully_accepted | start confirm timer |
| fully_accepted | feasibility feasible | fsb_ recorded | confirming | confirm_until set |
| fully_accepted | superseded offer | R04 | proposed | acceptances reset |
| confirming | clock | now ≥ confirm_until, no withdrawal | locked | offers locked (mod_offer) |
| confirming | slot withdraw | caller is slot `acc_` | proposed | acceptances reset |
| proposed | any slot declines | — | declined | slots closed; offers closed |
| proposed or confirming | proposer withdraw | before lock | withdrawn | slots closed |
| proposed | clock | now ≥ expires_at | expired | slots expired |
| locked | cycle.close | execution ended or cancelled (F02.S03) | closed | final |

## Validation & errors
`TWO.ILLEGAL_TRANSITION`; `TWO.EXPIRY_RANGE` on propose.

## Authorization
PS-015-05. Lock, expiry and close are system-only.

## Failure, idempotency, concurrency, offline
Withdraw vs lock race: whichever commits first wins; the loser gets `TWO.ILLEGAL_TRANSITION`. Confirm timer is persisted, not in-memory.

## Privacy, retention, abuse
State history retained per PS-015-07.

## Observability & budgets
Histogram: time from proposed to fully_accepted (p50, p95). Counter: withdraw during confirming.

## Tests
- TEST-PS-015-03-01 (unit): exhaustive table test.
- TEST-PS-015-03-02 (integration): withdraw at confirm_until −1 s vs lock at confirm_until: one winner.
- TEST-PS-015-03-03 (integration): process restart during confirming still locks at the stored deadline.

## Acceptance criteria
1. 100% (state, event) coverage in model test.
2. Zero locked cycles without a `feasible` result in fuzzing of 10,000 sequences.

## Assumptions & open decisions
- ASSUMPTION: 15-minute confirmation window is the MVP default.
- D04 OPEN: execution-phase partial failures are F02.S03 scope.

# PS-070-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05 claim states, R12, R13, R16; commands `clm.dispute`, `case.resolve`), CTR-EVT-001 (R02, R13). **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-03.R01 | Dispute states: `OPEN`, `RESPONDED`, `ESCALATED`, `RESOLVED`, `WITHDRAWN`. | MVP |
| PS-070-03.R02 | Raising a dispute moves the claim to `DISPUTED` in the same transaction; the claim's prior state is stored. | MVP |
| PS-070-03.R03 | No response within 7 d auto-escalates to a moderation case (`ESCALATED`). | MVP |
| PS-070-03.R04 | Withdrawal restores the claim's stored prior state (CTR-COM-001 `clm.dispute` inverse). | MVP |
| PS-070-03.R05 | A claim reversed by `RESOLVED` with outcome `reverse` moves to `REVERSED`; outcome `restore_prior` returns to the prior state. | MVP |
| PS-070-03.R06 | If a reorg (PS-072) occurs while `OPEN`, the reorg transition is recorded first; the dispute keeps its raise-time version for audit. | MVP |

## Data / schema
Transition row: `dispute_id`, `from_status`, `event`, `to_status`, `claim_prior_state`, `state_version`, `actor_ref`, `recorded_at`.

## Commands / queries / events
`dispute.raised`, `dispute.responded`, `dispute.escalated`, `dispute.resolved`, `dispute.withdrawn`; claim-side events from CTR-COM-001 (`clm.disputed`, `clm.dispute_resolved`).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `dispute.raise` | PS-070-02 pass | `OPEN` | `clm.dispute` → claim `DISPUTED`; store prior state; `response_due_at` set |
| `OPEN` | `dispute.respond` | responder is other party; due date not passed | `RESPONDED` | `dispute.responded` |
| `OPEN` | timer, 7 d | no response | `ESCALATED` | case `cas_` created; `dispute.escalated` |
| `RESPONDED` | case opened | moderator assigned | `ESCALATED` | `dispute.escalated` |
| `OPEN` or `RESPONDED` | `dispute.withdraw` | raiser only | `WITHDRAWN` | claim restored to prior state |
| `ESCALATED` | `case.resolve` (outcome) | `mod_` with case grant | `RESOLVED` | `case.resolve`: `restore_prior` or `reverse` |
| `WITHDRAWN`, `RESOLVED` | any | — | none | `SYS.UNPROCESSABLE_STATE` |

## Validation & errors
Invalid transitions return `SYS.UNPROCESSABLE_STATE`; claim-state conflicts return `COM.INVALID_TRANSITION`.

## Authorization
Transitions follow PS-070-05. Timer transitions run as `sys_` principal scoped to dispute timers.

## Failure, idempotency, concurrency, offline
Raise and claim transition are one atomic write; if the claim transition fails, no dispute row exists. Timer job is idempotent on (`dispute_id`, `state_version`). Two parties acting concurrently: first committed wins, second gets `SYS.CONFLICT`.

## Privacy, retention, abuse
Transition log keeps status and actor only; statement text is not copied into transition rows.

## Observability & budgets
Gauge per status. Histogram of time `OPEN` → `RESOLVED` (target p95 ≤ 30 d, ASSUMPTION).

## Tests
- TEST-PS-070-03-01 (unit): transition table exhaustive; undefined pairs return `SYS.UNPROCESSABLE_STATE`.
- TEST-PS-070-03-02 (integration): raise sets claim `DISPUTED`, withdraw restores prior claim state (table over all 4 entry states).
- TEST-PS-070-03-03 (integration): no response for 7 d auto-escalates; fixture uses simulated clock.
- TEST-PS-070-03-04 (integration): reorg during `OPEN` keeps raise-time version and records reorg first.

## Acceptance criteria
1. Each claim entry state (`CLAIMED`, `COUNTERPARTY_ATTESTED`, `EXTERNALLY_VERIFIED`, `FINAL`) round-trips through raise and withdraw.
2. Auto-escalation occurs at 7 d ± 1 min in simulation.
3. No transition writes a claim state outside CTR-COM-001's state set.

## Assumptions & open decisions
- ASSUMPTION: 7-day response window; escalation to moderation is the default outcome for silence.
- D04 (PROVISIONAL default, unapproved).

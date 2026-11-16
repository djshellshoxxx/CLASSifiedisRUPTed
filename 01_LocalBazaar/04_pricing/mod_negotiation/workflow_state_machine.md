# PS-010-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, event envelope), CTR-ERR-001, CTR-CAP-001, CTR-COM-001 (quote pinning at acceptance).

**Decision labels:** Turn-based single-responder model is ASSUMPTION. Acceptance pins terms under PROVISIONAL (D03 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-03.R01 | States: `AWAITING_RESPONSE` (non-terminal), `AGREED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`, `VOIDED` (terminal). No other state exists. | MVP |
| PS-010-03.R02 | Exactly one party may act at a time: the party that did not make the last proposal. The opener cannot accept, reject or counter its own terms. | MVP |
| PS-010-03.R03 | Response window: 72 h from each proposal (ASSUMPTION). Negotiation lifetime ≤ 14 d from open (ASSUMPTION). Whichever ends first closes the negotiation. | MVP |
| PS-010-03.R04 | `AGREED` means the two parties accepted terms. It creates no exchange, transaction or payment record. Handoff to F09 (`trx_`) is a separate explicit command outside this module. | MVP |
| PS-010-03.R05 | Terminal states accept no further transitions. Any such command → `NEG.INVALID_TRANSITION`. | MVP |
| PS-010-03.R06 | Each committed transition increments `revision` by exactly 1 and emits one `negotiation.*` event in the same transaction. | MVP |
| PS-010-03.R07 | Timer-driven transitions (`expire`, `void`) are system-only and idempotent: applying them to a terminal negotiation is a no-op that returns the current state. | MVP |

## Data / schema
State and `terminal_reason` fields as in [PS-010-01](domain_schema.md). Transition log is the event stream (CTR-EVT-001 hash chain). No separate state table is authoritative.

## Commands / queries / events
Command and event names: [PS-010-04](commands_queries_events.md).

## States & transitions
| From | Event (command) | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `neg.open` | Actor is not listing owner; listing active; no active pair; feature enabled | AWAITING_RESPONSE (round 1) | Emit `negotiation.opened`; notify seller with generic preview |
| AWAITING_RESPONSE | `neg.counter` | Actor = non-last proposer; round < 10; terms differ; bounds and quote valid; before deadline | AWAITING_RESPONSE (round + 1, new deadline) | Emit `negotiation.countered`; notify other party |
| AWAITING_RESPONSE | `neg.accept` | Actor = non-last proposer; before deadline; listing active; listing version = snapshot; `terms_hash` matches; quote valid if cross-currency | AGREED | Emit `negotiation.agreed` with pinned terms; no `trx_` created |
| AWAITING_RESPONSE | `neg.reject` | Actor = non-last proposer; before deadline | REJECTED | Emit `negotiation.rejected` |
| AWAITING_RESPONSE | `neg.withdraw` | Actor is either participant; before deadline | WITHDRAWN | Emit `negotiation.withdrawn` |
| AWAITING_RESPONSE | `neg.expire` (sys) | now ≥ response deadline or ≥ expires_at | EXPIRED | Emit `negotiation.expired` |
| AWAITING_RESPONSE | `neg.void` (sys) | Listing removed or inactive | VOIDED | Emit `negotiation.voided`; notify both parties |
| Any terminal | any | — | unchanged | `NEG.INVALID_TRANSITION` |

Accepting after the deadline returns `NEG.WINDOW_CLOSED` and does not transition. The expiry job performs the transition.

## Validation & errors
Guard failures map to codes in [PS-010-02](validation_rules.md): `NEG.NOT_YOUR_TURN`, `NEG.WINDOW_CLOSED`, `NEG.INVALID_TRANSITION`, `NEG.LISTING_INACTIVE`, `NEG.LISTING_CHANGED`, `NEG.ROUND_LIMIT`.

## Authorization
Guards on actor identity use the relation rules in [PS-010-05](authorization_capabilities.md). Relation (participant) is derived from state at decision time (CTR-CAP-001 R05).

## Failure, idempotency, concurrency, offline
- Two commands at the same `expected_revision`: first commit wins; second returns `EVT.REVISION_CONFLICT` and the client re-reads.
- Accept racing with expiry: whichever commits first decides. The loser returns `NEG.WINDOW_CLOSED` or `EVT.REVISION_CONFLICT`.
- Accept racing with listing edit: accept checks listing version inside the same transaction.
- Crash mid-transition: transaction is atomic; no half-applied state.

## Privacy, retention, abuse
Transitions emit no free text. Notification previews are generic (CTR-PRV-001 R10). Retention of terminal states: [PS-010-07](privacy_retention_abuse.md).

## Observability & budgets
`negotiation_transitions_total{from,to,event}`; `negotiation_invalid_transition_total{from,event}`. Expiry lag p95 ≤ 120 s (ASSUMPTION).

## Tests
- TEST-PS-010-03-01 (table): every row above passes; every other from/event pair returns `NEG.INVALID_TRANSITION`.
- TEST-PS-010-03-02 (turn): opener cannot accept or counter its own terms; `NEG.NOT_YOUR_TURN` returned.
- TEST-PS-010-03-03 (deadline race): accept at deadline + 1 s → `NEG.WINDOW_CLOSED`; expiry then sets EXPIRED once.
- TEST-PS-010-03-04 (idempotent timers): `neg.expire` applied twice, or to AGREED, is a no-op.
- TEST-PS-010-03-05 (revision): every committed transition has `revision` = previous + 1.
- TEST-PS-010-03-06 (agreed does not create trx): AGREED produces no `trx_` record.

## Acceptance criteria
1. The transition table is the only source of legal transitions (TEST-PS-010-03-01).
2. No path leaves a terminal state (property test, see [PS-010-09](contract_and_acceptance_tests.md)).
3. TEST-PS-010-03-01 through -06 pass.

## Assumptions & open decisions
- ASSUMPTION: single responder per turn; no simultaneous counter-proposals.
- ASSUMPTION: 72 h response window, 14-day lifetime.
- PROVISIONAL (D03 default, unapproved): pinned quote at accept.
- OPEN (D04): post-agreement cancellation or partial execution is not modeled; any reversal is a new process owned by F09.

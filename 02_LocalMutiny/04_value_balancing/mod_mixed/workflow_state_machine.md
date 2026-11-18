# PS-026-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim states), CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-03.R01 | Leg states in a revision: `DRAFT` → `DECLARED` → `CONSENTED` (all participants consented to the revision) → `SUBMITTED` (claim `CLAIMED`). `WITHDRAWN` is reachable from `DRAFT` or `DECLARED` only. | MVP |
| PS-026-03.R02 | After `SUBMITTED`, leg state mirrors the CTR-COM-001 claim state; no leg state named `PAID`, `SETTLED` or `COMPLETE`. | MVP |
| PS-026-03.R03 | Any change to a `DECLARED` or `CONSENTED` leg creates revision N+1 and resets all consents to `PENDING`. | MVP |
| PS-026-03.R04 | A leg not attested within 72 h after `due_by` moves to `UNATTESTED` (no auto-settlement; no platform action). | MVP |

## Data / schema
State is stored as `leg_status` on the leg row (PS-026-01). Claim state is authoritative in F09 and copied read-only.

## Commands / queries / events
Transitions are triggered by commands in PS-026-04 and by claim events from CTR-COM-001 (`clm.attested`, `clm.disputed`, `clm.reorged`).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | mixed.leg.declare | Validation passes (PS-026-02) | DRAFT | New revision N |
| DRAFT | mixed.leg.declare_done | Proposer marks ready | DECLARED | Notify participants |
| DECLARED | cyc.consent (all parties) | Consent matches revision hash | CONSENTED | None |
| DECLARED, CONSENTED | mixed.leg.change | Any field change | DRAFT (revision N+1) | Consents reset |
| DRAFT, DECLARED | mixed.leg.withdraw | Proposer | WITHDRAWN | Event emitted |
| CONSENTED | clm.submit | Payer submits claim | SUBMITTED | Creates `clm_` (F09) |
| SUBMITTED | clm.attested | Receiver signs `claim_hash` | SUBMITTED (claim COUNTERPARTY_ATTESTED) | Notify payer |
| SUBMITTED | timer (due_by + 72 h) | No attestation | UNATTESTED | Notify both |
| SUBMITTED | clm.disputed | Party, within 14-day window | DISPUTED | Hand to F09.S02.M02 |

Forbidden transitions return `MIXED.LEG_STATE_INVALID` (409 conflict, not retryable). Terminal: WITHDRAWN, and SUBMITTED with claim FINAL or REVERSED.

## Validation & errors
`MIXED.LEG_STATE_INVALID` (conflict, retryable false, diagnostic: from-state enum only).

## Authorization
Transition guards reuse CTR-CAP-001 actions (`cyc.propose`, `cyc.consent`, `cyc.withdraw`). Timers run as `sys_`.

## Failure, idempotency, concurrency, offline
Each transition checks `expected_revision` (CTR-EVT-001 R02). Timer firing is idempotent per (leg, due_by). A crash between `clm.submit` and the leg update is repaired by reconciling on `claim_id` (PS-026-06).

## Privacy, retention, abuse
State events carry `max_data_class` FINANCIAL_EVIDENCE. Timer notifications contain no amounts in push previews (CTR-PRV-001).

## Observability & budgets
Metric: `mixed_leg_transitions_total{from,to}`. Stuck legs: count of SUBMITTED older than due_by + 72 h, alert > 0 for 1 h.

## Tests
- TEST-PS-026-03-01 (unit): every row in the table; every other pair rejected.
- TEST-PS-026-03-02 (property): consent is reset on any field change (PS-026-03.R03).
- TEST-PS-026-03-03 (integration): due_by timer fires once under duplicate scheduler delivery.
- TEST-PS-026-03-04 (negative): no path reaches a state named PAID.

## Acceptance criteria
1. State table is complete for all leg states; lint enumerates states and fails on unlisted values.
2. UI labels for SUBMITTED never contain "paid", "payment received" or "settled" (CTR-COM-001 R15).
3. UNATTESTED never changes claim state.

## Assumptions & open decisions
- ASSUMPTION: 72 h attestation grace period.
- PROVISIONAL: partial execution handled by explicit attestations and compensating recovery (D04 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).

# PS-040-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim states, R07 cash ceiling, R16 dispute window), CTR-EVT-001 (revision), CTR-CAP-001 (case decisions).

**Decision labels:** D09 no custody (PROVISIONAL). D06 signed statements only (PROVISIONAL). Consent and release timeouts are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-03.R01 | Status set is exactly PROPOSED, AGREED, HELD, RELEASE_PENDING, PARTIALLY_RELEASED, RELEASED, DISPUTED, CANCELLED. No `PAID` or `SETTLED` status. | MVP |
| PS-040-03.R02 | `HELD` requires a linked claim at `COUNTERPARTY_ATTESTED` or higher (CTR-COM-001 R07 caps cash there). | MVP |
| PS-040-03.R03 | `RELEASED` requires an owner attestation and a renter confirmation. No automatic release on timeout. | MVP |
| PS-040-03.R04 | A release-pending deposit with no response for 14 days is flagged for escalation, not released or deducted (ASSUMPTION). | MVP |
| PS-040-03.R05 | Consent to `AGREED` expires 72 h after `PROPOSED` (ASSUMPTION) → `CANCELLED`, reason `CONSENT_EXPIRED`. | MVP |
| PS-040-03.R06 | Any transition not in the table → `DEPOSITS.INVALID_TRANSITION` (409), state unchanged. | MVP |

## Data / schema
Transitions append `deposit.<event>` events with `state_version` incremented by 1 (CTR-EVT-001 R02). Status is never updated in place.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | deposit.proposed | rental eligible; terms valid | PROPOSED | Notify other party |
| PROPOSED | deposit.agreed | counterparty consents to `terms_hash` | AGREED | Notify both |
| PROPOSED, AGREED | deposit.cancelled | proposer withdraws, or R05 expiry | CANCELLED | Notify both |
| AGREED | deposit.held | claim `clm.attested` at `COUNTERPARTY_ATTESTED` | HELD | Start rental hold |
| HELD | deposit.release_requested | `rtn_` closed by F05.S02.M02 | RELEASE_PENDING | Notify owner |
| RELEASE_PENDING | deposit.released | owner attest + renter confirm; sum = held | RELEASED | Close record |
| RELEASE_PENDING | deposit.partially_released | agreed `dmg_` lines; deduction ≤ held | PARTIALLY_RELEASED | Residual remains held |
| PARTIALLY_RELEASED | deposit.released | residual attested | RELEASED | Close record |
| HELD, RELEASE_PENDING, PARTIALLY_RELEASED | deposit.disputed | party; inside CTR-COM-001 R16 window | DISPUTED | Freeze transitions except resolution |
| DISPUTED | deposit.dispute_resolved | `mod` case decision | prior state or RELEASED | Decision record |

## States & transitions
Terminal: RELEASED, CANCELLED. Forbidden pairs return R06. Cash-method claims cannot reach `FINAL` (CTR-COM-001 R07), so no transition waits on verification.

## Validation & errors
Guard failures: `DEPOSITS.INVALID_TRANSITION` (409, non-retryable); `DEPOSITS.TERMS_CHANGED` (409) when the hash differs; `DEPOSITS.CONSENT_EXPIRED` (409).

## Authorization
Actor per transition is in PS-040-05. A transition's actor must be a participant or a case-scoped `mod`.

## Failure, idempotency, concurrency, offline
Each event carries `expected_revision`. Stale writes → `SYS.CONFLICT`. Dispute and release race: one wins, the other re-reads (CTR-COM-001 concurrency rule).

## Privacy, retention, abuse
State history is FINANCIAL_EVIDENCE, retained under RET-EVD.

## Observability & budgets
`deposit_transitions_total{from,to}`, `deposit_invalid_transition_total`. Alert: any `RELEASED` without an owner-attest event (must be 0).

## Tests
- TEST-PS-040-03-01 (state): every table row passes; every other pair returns R06.
- TEST-PS-040-03-02 (guard): `HELD` with only a `CLAIMED` claim is rejected.
- TEST-PS-040-03-03 (timeout): AGREED after 72 h becomes CANCELLED with `CONSENT_EXPIRED`.
- TEST-PS-040-03-04 (race): simultaneous release and dispute yield exactly one winner.

## Acceptance criteria
1. No path reaches `RELEASED` without owner attestation and renter confirmation (TEST-PS-040-03-01).
2. Escalation fires at 14 days with no release action (R04).
3. Every transition emits exactly one event.

## Assumptions & open decisions
- ASSUMPTION: 72 h consent expiry and 14-day escalation; F05 review (OPEN).
- PROVISIONAL (D09, unapproved): no release without party attestation.
- OPEN: whether `PARTIALLY_RELEASED` may repeat (multiple deductions).

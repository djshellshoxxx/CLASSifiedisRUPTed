# PS-042-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001, CTR-COM-001 (no custody; evidence style).

**Decision labels:** D04 OPEN: no atomic real-world handover. D06 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-03.R01 | Status set exactly SCHEDULED, OWNER_ATTESTED, RENTER_ATTESTED, COMPLETE, CONTESTED, EXPIRED, CANCELLED. | MVP |
| PS-042-03.R02 | `COMPLETE` means both parties signed matching checklists and digests. It does not mean verified physical transfer. UI copy must say "both parties confirmed" (D06). | MVP |
| PS-042-03.R03 | `COMPLETE` sets the rental to `ACTIVE` via `rnt_` event (owner F05.S02). | MVP |
| PS-042-03.R04 | Mismatched checklists or digests move to `CONTESTED`; no auto-resolution. | MVP |
| PS-042-03.R05 | No attestation by window end + 24 h → `EXPIRED`. | MVP |
| PS-042-03.R06 | Other transitions → `RNTHAND.INVALID_TRANSITION` (409). | MVP |

## Data / schema
Each event increments `state_version`; attestations invalidated if state changes after signing.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | rental_handoff.scheduled | R02 rental state ok | SCHEDULED | Notify both |
| SCHEDULED | rental_handoff.attested (owner) | owner attest valid (PS-042-02 R04, R06) | OWNER_ATTESTED | Notify renter |
| SCHEDULED | rental_handoff.attested (renter) | renter attest valid | RENTER_ATTESTED | Notify owner |
| OWNER_ATTESTED | rental_handoff.attested (renter) | checklist and digests equal owner's | COMPLETE | Rental → ACTIVE |
| RENTER_ATTESTED | rental_handoff.attested (owner) | checklist and digests equal renter's | COMPLETE | Rental → ACTIVE |
| OWNER_ATTESTED, RENTER_ATTESTED | rental_handoff.contested | other party's attest differs | CONTESTED | Notify both; case queue after 24 h |
| CONTESTED | rental_handoff.attested (both) | both re-attest identical content | COMPLETE | Rental → ACTIVE |
| CONTESTED | rental_handoff.cancelled | `mod` case decision | CANCELLED | Rental stays RESERVED |
| SCHEDULED, OWNER_ATTESTED, RENTER_ATTESTED | rental_handoff.expired | R05 | EXPIRED | Notify both; rental not activated |
| SCHEDULED, OWNER_ATTESTED, RENTER_ATTESTED | rental_handoff.cancelled | either party before COMPLETE | CANCELLED | Notify both |

## States & transitions
Terminal: COMPLETE, EXPIRED, CANCELLED.

## Validation & errors
`RNTHAND.INVALID_TRANSITION` (409), `RNTHAND.ALREADY_COMPLETE` (409), `RNTHAND.EXPIRED` (410). Non-retryable.

## Authorization
Party attestations and cancels; `mod` case decisions for CONTESTED.

## Failure, idempotency, concurrency, offline
Revision check per write; two attestations racing: second gets `SYS.CONFLICT` and re-reads. Expiry runs as idempotent `sys` job.

## Privacy, retention, abuse
History retained RET-PRIV; no location precision in history.

## Observability & budgets
`rental_handoff_transitions_total{from,to}`; alert on COMPLETE without both attestation events (must be 0).

## Tests
- TEST-PS-042-03-01 (state): every table row passes; others return R06.
- TEST-PS-042-03-02 (race): simultaneous attestations → one COMPLETE, no double activation.
- TEST-PS-042-03-03 (mismatch): differing checklist → CONTESTED.
- TEST-PS-042-03-04 (expiry): no attestation at window end + 24 h → EXPIRED; rental stays RESERVED.

## Acceptance criteria
1. No path reaches COMPLETE with one attestation (TEST-PS-042-03-01).
2. Rental activation happens exactly once per COMPLETE (TEST-PS-042-03-02).
3. Copy never claims verified transfer (R02).

## Assumptions & open decisions
- ASSUMPTION: CONTESTED case-queue delay 24 h.
- OPEN (D04): compensation when one party disputes after COMPLETE.

# PS-043-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-COM-001 (party rights).

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL. Verb mapping ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-05.R01 | Default deny on every return action. | MVP |
| PS-043-05.R02 | Renter declares; owner confirms or opens damage; system closes. No other principal writes return state. | MVP |
| PS-043-05.R03 | Non-participants receive `SYS.NOT_FOUND`. | MVP |
| PS-043-05.R04 | `renter_note` and checklist visible to the two participants and case-scoped `mod` only. | MVP |
| PS-043-05.R05 | `global` and `ope` single approval cannot read notes (CTR-CAP-001 R04, R07). | MVP |

## Data / schema
Capabilities: `rental_return.create`, `rental_return.attest`, `rental_return.consent` (owner confirm), `rental_return.read`, `rental_return.moderate`.

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| renter | rental_return.attest (declare) | participant | ALLOW |
| owner | rental_return.consent (confirm) | participant | ALLOW inside window |
| owner | rental_return.attest (report damage) | participant | ALLOW inside window |
| system | rental_return.create / close | none | ALLOW (sys, scope return only) |
| participant | rental_return.read | participant | ALLOW |
| non-participant | any | none | DENY → SYS.NOT_FOUND |
| mod | rental_return.moderate | case | ALLOW with case grant |
| ope | rental_return.read | global | DENY → SYS.FORBIDDEN |

## States & transitions
Participation derived at decision time (CTR-CAP-001 R05).

## Validation & errors
`SYS.FORBIDDEN` only for records the actor already knows; else `SYS.NOT_FOUND`.

## Authorization
Server-side on every read (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Revocation at next decision.

## Privacy, retention, abuse
Operator access to notes requires case scope and dual control; each `mod` read writes `aud_` (CTR-CAP-001 R08).

## Observability & budgets
`return_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-043-05-01 (unit): matrix rows.
- TEST-PS-043-05-02 (security): owner cannot declare on renter's behalf.
- TEST-PS-043-05-03 (security): `ope` single approval cannot read notes.
- TEST-PS-043-05-04 (integration): system scope cannot write `damage_ids` outside the link path.

## Acceptance criteria
1. Matrix matches CTR-CAP-001 vocabulary.
2. Zero cross-party writes accepted.
3. Dual control on operator note access.

## Assumptions & open decisions
- ASSUMPTION: verb mapping pending CTR-CAP-001 review (OPEN, F16).

# PS-042-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-COM-001 (party rights).

**Decision labels:** CTR-CAP-001 grant model PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-05.R01 | Default deny on all handoff actions. | MVP |
| PS-042-05.R02 | Only the rental's owner and renter may attest; participation derived at decision time. | MVP |
| PS-042-05.R03 | Non-participants receive `SYS.NOT_FOUND`. | MVP |
| PS-042-05.R04 | Photo bytes visible to participants and case-scoped `mod` only. | MVP |
| PS-042-05.R05 | `ope` single approval cannot read checklists or photos (CTR-CAP-001 R07). | MVP |

## Data / schema
Capabilities: `rental_handoff.create`, `rental_handoff.attest`, `rental_handoff.reject` (contest), `rental_handoff.withdraw` (cancel), `rental_handoff.read`, `rental_handoff.moderate`.

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| owner or renter | rental_handoff.create | participant | ALLOW |
| owner or renter | rental_handoff.attest | participant | ALLOW (own side only) |
| either party | rental_handoff.reject | participant | ALLOW while CONTESTED |
| either party | rental_handoff.withdraw | participant | ALLOW before COMPLETE |
| participant | rental_handoff.read | participant | ALLOW |
| non-participant | any | none | DENY → SYS.NOT_FOUND |
| mod | rental_handoff.moderate | case | ALLOW with case grant |
| ope | rental_handoff.read | global | DENY → SYS.FORBIDDEN |

## States & transitions
Participation derived from rental (CTR-CAP-001 R05).

## Validation & errors
`SYS.FORBIDDEN` only for known-to-actor records; else `SYS.NOT_FOUND`.

## Authorization
Server-side on every read and photo download (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Revocation at next decision. Zero decision-cache TTL for photo reads.

## Privacy, retention, abuse
`mod` photo reads write `aud_` records (CTR-CAP-001 R08).

## Observability & budgets
`rental_handoff_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-042-05-01 (unit): matrix rows.
- TEST-PS-042-05-02 (security): renter cannot attest owner side.
- TEST-PS-042-05-03 (security): `ope` single approval blocked on photos.
- TEST-PS-042-05-04 (integration): former participant loses read on next call after rental change.

## Acceptance criteria
1. Matrix uses only CTR-CAP-001 vocabulary (mapping ASSUMPTION).
2. Zero cross-party attestations accepted.
3. Dual control on operator photo access.

## Assumptions & open decisions
- ASSUMPTION: verb mapping (`attest`, `reject`, `withdraw`), pending CTR-CAP-001 vocabulary review (OPEN, F16).

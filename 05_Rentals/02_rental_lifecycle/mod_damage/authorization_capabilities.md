# PS-041-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (scopes, verbs, dual control), CTR-PRV-001 (classes), CTR-COM-001 (party and dispute rights).

**Decision labels:** Grant model PROVISIONAL (CTR-CAP-001). Verb mapping is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-05.R01 | Default deny on every damage action (CTR-CAP-001 R01). | MVP |
| PS-041-05.R02 | Only the rental owner may create or withdraw a report; only the renter may acknowledge or contest. | MVP |
| PS-041-05.R03 | Non-participants receive `SYS.NOT_FOUND`. | MVP |
| PS-041-05.R04 | Photo digests and photo bytes visible to participants and case-scoped `mod` only. | MVP |
| PS-041-05.R05 | `global` scope and `ope` single approval never read photos or descriptions (CTR-CAP-001 R04, R07). | MVP |

## Data / schema
Capabilities: `damage.create`, `damage.consent`, `damage.reject`, `damage.withdraw`, `damage.read`, `damage.moderate`.

## Commands / queries / events
| Principal | Action | Scope | Outcome |
|---|---|---|---|
| owner | damage.create | participant | ALLOW inside window |
| renter | damage.consent (acknowledge) | participant | ALLOW per line |
| renter | damage.reject (contest) | participant | ALLOW |
| owner | damage.withdraw | participant | ALLOW before ACKNOWLEDGED |
| participant | damage.read | participant | ALLOW; photos included |
| non-participant | any | none | DENY → SYS.NOT_FOUND |
| mod | damage.moderate | case, with purpose | ALLOW with case grant |
| ope | damage.read | global | DENY → SYS.FORBIDDEN |

## States & transitions
Participant status derived at decision time (CTR-CAP-001 R05).

## Validation & errors
`SYS.FORBIDDEN` only for `global` or case-known records; otherwise `SYS.NOT_FOUND`.

## Authorization
Server-side on every read including photo downloads (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Revocation at next decision; zero decision cache for photo reads.

## Privacy, retention, abuse
Each `mod` photo read writes `aud_` with resource ID, purpose and decision ID (CTR-CAP-001 R08).

## Observability & budgets
`damage_authz_decisions_total{action,outcome,reason_code}`.

## Tests
- TEST-PS-041-05-01 (unit): matrix rows return outcome and reason code.
- TEST-PS-041-05-02 (security): renter cannot create or withdraw a report.
- TEST-PS-041-05-03 (security): `ope` single approval cannot read photos (CTR-CAP-001 R07).
- TEST-PS-041-05-04 (integration): photo URL from another rental returns `SYS.NOT_FOUND`.

## Acceptance criteria
1. Matrix matches CTR-CAP-001 vocabulary.
2. Zero cross-rental photo reads in TEST-PS-041-05-04.
3. Dual control enforced for every operator photo access.

## Assumptions & open decisions
- ASSUMPTION: verb mapping above, pending CTR-CAP-001 vocabulary review (OPEN, F16).
- PROVISIONAL (CTR-CAP-001 grant model, unapproved).

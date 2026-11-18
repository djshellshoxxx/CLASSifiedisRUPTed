# PS-039-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-05.R01 | Capabilities: `rental.hold`, `rental.block`, `rental.confirm`, `rental.release`, `availability.read`. | MVP |
| PS-039-05.R02 | Only the item owner (`acc_` on the rental listing) may block or unblock. Owner is resolved from 01_listings, not from request data. | MVP |
| PS-039-05.R03 | `rental.confirm` is callable only by the rental lifecycle service principal (`sys_`). | MVP |
| PS-039-05.R04 | Anonymous callers may read FREE or BUSY only, rate-limited to 60 requests per minute per IP-class bucket (ASSUMPTION). | MVP |

## Data / schema
Grant records per CTR-CAP-001 (`grt_`). Owner link stored by listing ID.

## Commands / queries / events
Each command checks its capability before validation.

## States & transitions
Revoked owner grant does not change existing blocks; further block commands denied.

## Validation & errors
`CAP.DENIED`; `CAP.SCOPE_MISMATCH` when owner acts on another listing.

## Authorization
| Actor | Action | Resource | Capability |
|---|---|---|---|
| renter (acc_) | hold, release own hold | block | rental.hold, rental.release |
| owner (acc_) | block, unblock | owner's item | rental.block |
| rental lifecycle (sys_) | confirm | block | rental.confirm |
| anonymous or any | read FREE/BUSY | item calendar | availability.read |
| any other | any | any | deny |

## Failure, idempotency, concurrency, offline
Grant checks synchronous; cache TTL <= 60 s.

## Privacy, retention, abuse
Renter cannot see other renters' rental_id. Owner sees rental_id for own item only, not renter identity beyond pseudonymous account reference.

## Observability & budgets
Denials per capability; alert on 10x spike.

## Tests
- TEST-PS-039-05-01 (negative): renter cannot call block; owner cannot call confirm.
- TEST-PS-039-05-02 (scope): owner of listing A blocked from listing B.
- TEST-PS-039-05-03 (rate): 61st anonymous read in a minute throttled.

## Acceptance criteria
1. Each command maps to one capability.
2. No non-owner receives rental_id.
3. Rate limit verified.

## Assumptions & open decisions
- ASSUMPTION: 60 anonymous reads per minute.
- PROVISIONAL (no Dxx): owner identity resolved from listing, not client claim.

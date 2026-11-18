# PS-039-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-04.R01 | Every state-changing command has an idempotency key. | MVP |
| PS-039-04.R02 | `availability.read` returns free and busy intervals without renter identity, rental_id or reason. | MVP |
| PS-039-04.R03 | Hold and block commands respond within 200 ms p95. | MVP |
| PS-039-04.R04 | Events follow CTR-EVT-001; `rental_id` is included only in owner and renter scoped delivery. | MVP |

## Data / schema
- `rental.availability.hold { item_id, start_date, end_date }` key `item_id|start|end|renter_id`
- `rental.availability.block { item_id, start_date, end_date, block_type, expected_version? }` key `item_id|start|end|block_type|owner_id|request_id`
- `rental.availability.unblock { block_id, expected_version }`
- `rental.availability.release { block_id, expected_version }` (renter own hold or pre-handoff booking)
- `rental.availability.confirm { block_id, rental_id }` (sys only)
- `availability.read { item_id, from, to }` returns `[{ start_date, end_date, state: FREE|BUSY }]`, max 366 days.

## Commands / queries / events
| Name | Type | Event | Idempotent |
|---|---|---|---|
| rental.availability.hold | command | availability.hold_created | yes |
| rental.availability.confirm | command (sys) | availability.booked | yes |
| rental.availability.block | command (owner) | availability.blocked | yes |
| rental.availability.unblock | command (owner) | availability.unblocked | yes |
| rental.availability.release | command | availability.released | yes |
| availability.read | query | none | n/a |
| (lifecycle) | consumes handoff and return events | availability.in_use, availability.released | yes |

## States & transitions
Commands map only to PS-039-03 rows.

## Validation & errors
PS-039-02 codes in CTR-ERR-001 envelope.

## Authorization
See PS-039-05.

## Failure, idempotency, concurrency, offline
Duplicate command returns original result. Stale `expected_version` returns 409. Query is cacheable for 30 s with ETag per item.

## Privacy, retention, abuse
Query response contains only dates and FREE or BUSY. Event max_data_class PSEUDONYMOUS (rental_id) or LOCATION_COARSE (timezone) per CTR-PRV-001 R02.

## Observability & budgets
Latency histogram per command; query p95 <= 150 ms for 366-day window.

## Tests
- TEST-PS-039-04-01 (contract): events validate against CTR-EVT-001.
- TEST-PS-039-04-02 (negative): anonymous `availability.read` response lacks rental_id and renter identity.
- TEST-PS-039-04-03 (idempotency): duplicate hold request yields one block.

## Acceptance criteria
1. Each command lists key, capability, version and error codes.
2. Read responses pass privacy lint.
3. Latency budgets met in fixtures.

## Assumptions & open decisions
- ASSUMPTION: `availability.read` is public without login, rate-limited (PS-039-05).
- PROVISIONAL (no Dxx): `confirm` is only invoked by the rental lifecycle service principal.

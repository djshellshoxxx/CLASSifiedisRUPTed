# PS-039-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-02.R01 | Reject `end_date <= start_date` with `AVAIL.INVALID_RANGE` (400). | MVP |
| PS-039-02.R02 | Reject span > 365 days with `AVAIL.SPAN_TOO_LONG` (400). | MVP |
| PS-039-02.R03 | Reject start dates more than 730 days ahead or before today in the item timezone with `AVAIL.DATE_OUT_OF_WINDOW` (400). | MVP |
| PS-039-02.R04 | Reject overlap with an unreleased block with `AVAIL.CONFLICT` (409). Message lists the nearest free interval, not the blocking block's identity. | MVP |
| PS-039-02.R05 | Reject `OWNER_BLOCK` or `MAINTENANCE` that would overlap BOOKED or IN_USE with `AVAIL.BOOKED_PROTECTED` (409). | MVP |
| PS-039-02.R06 | Reject a second hold extension with `AVAIL.HOLD_EXTENSION_LIMIT` (409). | MVP |

## Data / schema
Dates are ISO 8601 `YYYY-MM-DD`. Timezone must be a valid IANA name. Unknown fields rejected.

## Commands / queries / events
Validation runs before the exclusion constraint is attempted, so users get a specific code, not a raw DB error.

## States & transitions
Validation reads current block states only; transitions are in PS-039-03.

## Validation & errors
| Code | Retryable | Message key | Diagnostic |
|---|---|---|---|
| AVAIL.INVALID_RANGE | false | avail.err.range | end <= start |
| AVAIL.SPAN_TOO_LONG | false | avail.err.span | span > 365 |
| AVAIL.DATE_OUT_OF_WINDOW | false | avail.err.window | outside window |
| AVAIL.CONFLICT | false | avail.err.conflict | overlap; show next free dates |
| AVAIL.BOOKED_PROTECTED | false | avail.err.protected | owner block on booked dates |
| AVAIL.HOLD_EXTENSION_LIMIT | false | avail.err.hold_limit | second extension |
| AVAIL.TIMEZONE_INVALID | false | avail.err.timezone | not IANA |

## Authorization
Validation runs after capability checks (PS-039-05).

## Failure, idempotency, concurrency, offline
Validation is pure. Conflict detection is re-run inside the write transaction.

## Privacy, retention, abuse
Diagnostics never include `rental_id` or renter identity.

## Observability & budgets
Count each code per minute. Validation p95 <= 2 ms.

## Tests
- TEST-PS-039-02-01 (unit): one fixture per code.
- TEST-PS-039-02-02 (property): spans of 1..366 days accepted only up to 365.
- TEST-PS-039-02-03 (negative): owner block over a BOOKED day returns BOOKED_PROTECTED.

## Acceptance criteria
1. Each code has a fixture and a message key.
2. Conflict message never reveals the blocking renter.
3. Timezone validation rejects non-IANA strings.

## Assumptions & open decisions
- ASSUMPTION: 730-day booking horizon.
- PROVISIONAL (D05 default, unapproved): timezone is an item attribute, not a renter attribute.

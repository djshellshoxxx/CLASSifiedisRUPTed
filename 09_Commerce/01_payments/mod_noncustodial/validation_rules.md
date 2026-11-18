# PS-069-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R01, R02, R11), CTR-ERR-001 (R02–R07), CTR-SCH-001. **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-02.R01 | Every `route.declare` or `route.replace` request is validated in this order: schema, custody scan, method, rail, destination, limits, trx state. First failure returns; no partial write. | MVP |
| PS-069-02.R02 | Destination validation is delegated to the registered adapter for `chain`. Adapter timeout 2 s; on timeout the request fails retryable. | MVP |
| PS-069-02.R03 | `contact_hint` ≤ 200 Unicode code points; no URI scheme (`://`), no control characters. | MVP |
| PS-069-02.R04 | Syntax validation proves format only, not control of the destination (ASSUMPTION). | MVP |
| PS-069-02.R05 | Error details name the field path and rule enum only; they never echo `destination` or `contact_hint` (CTR-ERR-001 R07). | MVP |

## Data / schema
Validation rule registry (`rule` enum): `schema`, `custody_scan`, `method_enum`, `rail_registered`, `destination_syntax`, `destination_duplicate`, `route_limit`, `hint_syntax`, `trx_open`, `route_not_in_use`, `participant`.

## Commands / queries / events
Applies to `route.declare`, `route.replace`, `route.withdraw` (PS-069-04).

## States & transitions
Validation failures never create a route row, so no state transition occurs.

## Validation & errors
| Rule | Code | Retryable | Message key | Diagnostic (privacy-safe) |
|---|---|---|---|---|
| Unknown field | `SYS.REQUEST_MALFORMED` | false | `err.sys.request_malformed` | field path only |
| Custody-class field present | `COM.CUSTODY_FORBIDDEN` | false | `err.com.custody_forbidden` | field path only |
| Method not in enum | `NONCUST.METHOD_UNSUPPORTED` | false | `err.noncust.method_unsupported` | rule enum |
| Rail not registered or suspended | `NONCUST.RAIL_UNAVAILABLE` | true | `err.noncust.rail_unavailable` | `adapter_id` |
| Destination fails adapter syntax | `NONCUST.DESTINATION_INVALID` | false | `err.noncust.destination_invalid` | rule enum |
| Duplicate (trx, party, method, hash) | `NONCUST.ROUTE_DUPLICATE` | false | `err.noncust.route_duplicate` | route_id |
| More than 5 active routes | `NONCUST.ROUTE_LIMIT` | false | `err.noncust.route_limit` | count |
| Hint too long or contains scheme | `NONCUST.HINT_INVALID` | false | `err.noncust.hint_invalid` | length only |
| Trx at `FINAL`, `REVERSED` or cancelled | `NONCUST.TRX_CLOSED` | false | `err.noncust.trx_closed` | trx state |
| Withdraw while referenced by a claim in `CLAIMED` or later | `NONCUST.ROUTE_IN_USE` | false | `err.noncust.route_in_use` | claim count |
| Actor not a participant | `SYS.NOT_FOUND` | false | `err.sys.not_found` | none |

## Authorization
Validation runs after authentication and before capability evaluation for write paths; non-participants receive `SYS.NOT_FOUND` (CTR-CAP-001 R10).

## Failure, idempotency, concurrency, offline
Validation is deterministic for identical input and adapter state. Adapter unavailability is never treated as a validation pass.

## Privacy, retention, abuse
Validation logs record rule enum and code only. Rejected destinations are not stored.

## Observability & budgets
Counter per (code, rule). Alert when `COM.CUSTODY_FORBIDDEN` exceeds 0 per hour in production (attempted custody bypass).

## Tests
- TEST-PS-069-02-01 (unit): each row of the error table reproduces its code and message key.
- TEST-PS-069-02-02 (unit): `hint` of 200 vs 201 code points accepted vs rejected.
- TEST-PS-069-02-03 (integration): adapter timeout returns `NONCUST.RAIL_UNAVAILABLE` with retryable true.
- TEST-PS-069-02-04 (contract): error bodies for invalid destinations contain no destination text.

## Acceptance criteria
1. Each rule has exactly one code in the table above, registered in CTR-ERR-001 registry under module `NONCUST` or the shared code cited.
2. No error response contains `destination` or `contact_hint` values (tested with canary strings).
3. Validation order is deterministic (TEST-PS-069-02-01 covers the ordering).

## Assumptions & open decisions
- ASSUMPTION: `NONCUST` is the error module prefix (CTR-ERR-001 R02, 2–8 uppercase letters).
- ASSUMPTION: proof of destination ownership (signed challenge) is future scope.
- D09 (PROVISIONAL default, unapproved): instructions only, no custody checks beyond schema scan.

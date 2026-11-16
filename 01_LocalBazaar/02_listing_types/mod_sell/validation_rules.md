# PS-006-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-PRV-001, CTR-COM-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-02.R01 | All validation runs server-side before any write. Client checks are advisory only. | MVP |
| PS-006-02.R02 | Price failures return `SELL.TERMS_INVALID` with rule `not_decimal_string`, `not_positive`, `over_max_digits` or `unknown_currency`. | MVP |
| PS-006-02.R03 | Quantity outside 1–20 returns rule `out_of_range`. Quantity below the sold-and-held count returns rule `below_sold_count`. | MVP |
| PS-006-02.R04 | `condition` and `pickup_method` accept only the closed enums in PS-006-01. Other values return rule `not_in_enum`. | MVP |
| PS-006-02.R05 | Any location input other than a registered `region_cell` returns rule `precise_location`. The submitted value is never echoed. | MVP |
| PS-006-02.R06 | Terms writes while `sell_state` is RESERVED or HELD return `SELL.TERMS_LOCKED`. | MVP |
| PS-006-02.R07 | A request on the owner's own listing returns `SELL.SELF_REQUEST`. | MVP |
| PS-006-02.R08 | A second open request by the same buyer on the same listing returns `SELL.REQUEST_EXISTS`. Same idempotency key and digest returns the original result instead. | MVP |
| PS-006-02.R09 | A request when `quantity_remaining = 0` returns `SELL.SOLD_OUT`. A request on a listing the buyer cannot see returns `SYS.NOT_FOUND` (CTR-ERR-001 R08). | MVP |
| PS-006-02.R10 | Accept with a non-pending request returns `SELL.REQUEST_CLOSED`. Accept while RESERVED returns `SELL.RESERVATION_ACTIVE`. Stale `expected_revision` returns `SYS.CONFLICT`. | MVP |

## Data / schema
| Code | Category | HTTP | Retryable | Details rule enum |
|---|---|---|---|---|
| SELL.TERMS_INVALID | validation | 400 | false | not_decimal_string, not_positive, over_max_digits, unknown_currency, out_of_range, below_sold_count, not_in_enum, precise_location |
| SELL.SELF_REQUEST | validation | 400 | false | none |
| SELL.REQUEST_EXISTS | conflict | 409 | false | none |
| SELL.SOLD_OUT | conflict | 409 | false | none |
| SELL.REQUEST_LIMIT | rate_limited | 429 | true (`retry_after_ms`) | none |
| SELL.TERMS_LOCKED | precondition_failed | 412 | true | none |
| SELL.RESERVATION_ACTIVE | unprocessable_state | 422 | true | none |
| SELL.REQUEST_CLOSED | unprocessable_state | 422 | false | none |

Category `precondition_failed` is not in the CTR-ERR-001 HTTP table; the HTTP status for it is ASSUMPTION (412 used here; implementation must confirm against CTR-ERR-001 before use). Details `field` values are JSON-pointer paths (for example `/sell/price_minor`).

## States & transitions
Not applicable. Validation gates the transitions in [PS-006-03](workflow_state_machine.md).

## Validation & errors
Codes above are fixed per CTR-ERR-001 R03/R04. Offline-replayed writes are re-validated on arrival (see PS-006-06).

## Authorization
Validation runs after authorization. Unauthorized callers receive `SYS.NOT_FOUND` or `SYS.FORBIDDEN` before any rule above is evaluated. See [PS-006-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Replay of an offline-queued write is re-validated against current state. Stale writes return `SYS.CONFLICT`, not a silent merge.

## Privacy, retention, abuse
Rejected inputs are not stored. Error responses never contain submitted values (CTR-ERR-001 R07).

## Observability & budgets
Validation failure counts by rule enum only, no field values. See [PS-006-08](observability_performance.md).

## Tests
- TEST-PS-006-02-01 (unit): each rule enum value produces exactly one matching `SELL.TERMS_INVALID` detail.
- TEST-PS-006-02-02 (property): every `SELL.*` code has one fixed category, HTTP status and retryable value.
- TEST-PS-006-02-03 (unit): a coordinate-shaped `region_cell` returns rule `precise_location` and no echoed value.
- TEST-PS-006-02-04 (integration): duplicate request with same key returns the original result.
- TEST-PS-006-02-05 (offline): replayed `set_terms` against a changed revision returns `SYS.CONFLICT`.

## Acceptance criteria
1. Every rejection path in R02–R10 maps to exactly one code in the table.
2. No error body contains a submitted price, currency or location value.
3. The `precondition_failed` HTTP mapping is confirmed against CTR-ERR-001 before implementation.

## Assumptions & open decisions
- D05 PROVISIONAL (default: coarse regions). `precise_location` enforces it.
- D08 PROVISIONAL (default: local pending queue until relay ack). Replays are re-validated server-side.
- ASSUMPTION: request-limit values are in PS-006-07.

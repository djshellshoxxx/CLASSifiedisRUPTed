# PS-011-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (error envelope), CTR-ID-001, CTR-COM-001 (amounts, quotes), CTR-CAP-001 (visibility), CTR-PRV-001. PENDING CTR-COM-001 registry entry for COM.QUOTE_EXPIRED.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-02.R01 | Amount is a decimal string of integer minor units, value ≥ 1, ≤ 39 digits, no leading zero, ≤ 10^15 minor units (ASSUMPTION). Violation → OFFER.AMOUNT_INVALID. | MVP |
| PS-011-02.R02 | Currency equals listing currency, or a valid quote_id is supplied. Else OFFER.CURRENCY_MISMATCH. | MVP |
| PS-011-02.R03 | Quote must be unexpired at commit. Expired → COM.QUOTE_EXPIRED. | MVP |
| PS-011-02.R04 | Listing must be open (F01 state; PENDING F01 listing-state contract). Else OFFER.LISTING_NOT_OPEN. | MVP |
| PS-011-02.R05 | Buyer ≠ seller. Else OFFER.SELF_OFFER (403). | MVP |
| PS-011-02.R06 | At most one `submitted` offer per (buyer_ref, listing_id). Else OFFER.DUPLICATE_ACTIVE. | MVP |
| PS-011-02.R07 | expires_at in (now, created_at + 14 days]. Else OFFER.EXPIRY_INVALID. | MVP |
| PS-011-02.R08 | Block relation in either direction → SYS.NOT_FOUND, identical to a missing listing. | MVP |
| PS-011-02.R09 | Body ≤ 2 KiB and depth ≤ 4 (ASSUMPTION), checked before schema and crypto work. Else SYS.PAYLOAD_TOO_LARGE. | MVP |
| PS-011-02.R10 | Unknown or missing required fields → SYS.REQUEST_MALFORMED. | MVP |
| PS-011-02.R11 | Error details carry field path and rule only. Amount, currency and IDs are never echoed (CTR-ERR-001 R07). | MVP |
| PS-011-02.R12 | Check order: size, schema, authentication, visibility (SYS.NOT_FOUND), state, business rules. | MVP |

## Data / schema
Validation applies to the fields in PS-011-01 Data / schema. Rule identifiers are the `rule` values in CTR-ERR-001 details, lowercase, for example `amount_positive`, `currency_match`, `listing_open`, `not_self`, `single_active`, `expiry_window`.

## Commands / queries / events
Rules run inside `offer.submit` only. Accept, reject, withdraw and expire re-check state (PS-011-03), not these input rules.

## States & transitions
Not applicable.

## Validation & errors
| Code | Retryable | Category / HTTP | Field, rule |
|---|---|---|---|
| OFFER.AMOUNT_INVALID | false | validation / 400 | amount_minor, amount_positive or amount_format |
| OFFER.CURRENCY_MISMATCH | false | validation / 400 | currency, currency_match |
| OFFER.LISTING_NOT_OPEN | false | unprocessable_state / 422 | listing_id, listing_open |
| OFFER.SELF_OFFER | false | forbidden / 403 | listing_id, not_self |
| OFFER.DUPLICATE_ACTIVE | false | conflict / 409 | listing_id, single_active |
| OFFER.EXPIRY_INVALID | false | validation / 400 | expires_at, expiry_window |
| COM.QUOTE_EXPIRED | false | unprocessable_state / 422 | quote_id, valid_until_passed |
| SYS.NOT_FOUND | false | not_found / 404 | listing_id (also blocked relation) |
| SYS.REQUEST_MALFORMED | false | validation / 400 | field path of the offending input |
| SYS.PAYLOAD_TOO_LARGE | false | payload_too_large / 413 | body |

Message keys follow CTR-ERR-001 R05 (for example `err.offer.amount_invalid`).

## Authorization
Validation runs after authentication and before any state read that could disclose existence.

## Failure, idempotency, concurrency, offline
A rejected submit is not stored. A rejected offline replay moves to "not applied" on the client (PS-011-06). Validation is deterministic: the same input against the same listing state gives the same code.

## Privacy, retention, abuse
Rejection responses never confirm that a blocked party or a hidden listing exists. Rate limiting is in PS-011-07.

## Observability & budgets
Count of `OFFER.*` codes by rule (metric only; no values). Validation ≤ 2 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-011-02-01 (unit): each rule R01–R10 yields its single code; table above matches the registry.
- TEST-PS-011-02-02 (property): amount strings with leading zeros, signs, decimals or >39 digits are always rejected.
- TEST-PS-011-02-03 (negative): blocked buyer and missing listing produce byte-identical bodies except request_id.
- TEST-PS-011-02-04 (privacy fixture): amounts and IDs never appear in error bodies.
- TEST-PS-011-02-05 (offline): replayed invalid submit returns the same code and is not retried automatically.

## Acceptance criteria
1. Every rule has one test and one code.
2. Error registry lint (CTR-ERR-001 TEST-02) passes for all codes above.
3. No error body contains an input value.

## Assumptions & open decisions
- ASSUMPTION: 10^15 minor-unit ceiling; 2 KiB body limit.
- PROVISIONAL (D03 default, unapproved): quote validity at commit.
- OPEN: COM.QUOTE_EXPIRED registry entry (PENDING CTR-COM-001).

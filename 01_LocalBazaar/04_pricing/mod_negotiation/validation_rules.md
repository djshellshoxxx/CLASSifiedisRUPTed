# PS-010-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, codes), CTR-COM-001 (amount, currency, quote codes), CTR-ID-001, CTR-EVT-001 (revision and idempotency), CTR-SCH-001.

**Decision labels:** Negotiation bounds below are ASSUMPTION values, unapproved. Price-ratio bounds are PROVISIONAL (D03 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-02.R01 | Every command is validated against its closed schema before any state read. Unknown fields → `SYS.REQUEST_MALFORMED`. Payload ≤ 2 KiB (ASSUMPTION). | MVP |
| PS-010-02.R02 | `amount_minor` is a base-10 decimal string, no leading zeros, ≤ 39 digits, value > 0 for any proposal. Floats → `COM.AMOUNT_INVALID`. | MVP |
| PS-010-02.R03 | A proposal in the listing currency needs no quote. A proposal in another currency needs a valid `quote_id`; missing → `COM.QUOTE_MISSING`; expired → `COM.QUOTE_EXPIRED` for new proposals and for acceptance. | MVP |
| PS-010-02.R04 | A counter identical to the current terms (same `terms_hash`) → `NEG.TERMS_UNCHANGED`. | MVP |
| PS-010-02.R05 | A counter whose value falls outside 0.10× to 10.00× of the listing snapshot price (value compared after quote normalization) → `NEG.TERMS_OUT_OF_BOUNDS` (ASSUMPTION). | MVP |
| PS-010-02.R06 | `method_hint` must be in the closed CTR-COM-001 method set. Any other value → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-010-02.R07 | Listing must be `active` at open, counter and accept. Otherwise → `NEG.LISTING_INACTIVE`. | MVP |
| PS-010-02.R08 | Accept requires listing version equal to the snapshot. Otherwise → `NEG.LISTING_CHANGED`; the party must re-open. No silent re-pricing. | MVP |
| PS-010-02.R09 | Seller and initiator must differ by `acc_` (pseudonyms of one account count as the same party). Otherwise → `NEG.SELF_FORBIDDEN`. | MVP |
| PS-010-02.R10 | Round cap: proposal number ≤ 10 (ASSUMPTION). Round 11 → `NEG.ROUND_LIMIT`. | MVP |
| PS-010-02.R11 | Max one active negotiation per (listing, initiator) → `NEG.OPEN_EXISTS`. Max 20 active per initiator (ASSUMPTION) → `NEG.ACTIVE_LIMIT`. | MVP |
| PS-010-02.R12 | Accept and reject carry `terms_hash` of the terms being answered. Mismatch → `NEG.TERMS_HASH_MISMATCH`. | MVP |

## Data / schema
Validation uses the record schema in [PS-010-01](domain_schema.md) and command schemas in [PS-010-04](commands_queries_events.md). `details[].field` uses JSON-pointer paths; `details[].rule` uses these enums: `amount_format`, `amount_zero`, `quote_missing`, `quote_expired`, `terms_unchanged`, `ratio_bounds`, `method_not_allowed`, `listing_inactive`, `listing_changed`, `self_party`, `round_limit`, `open_limit`, `terms_hash_stale`. Input values are never echoed (CTR-ERR-001 R07).

## Commands / queries / events
Not applicable beyond validation order: schema → authentication → authorization → state guard → revision check → domain rules. Order is fixed so that unauthorized callers learn nothing about state.

## States & transitions
Not applicable. Guards that depend on state are listed in [PS-010-03](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | Message key | Diagnostic (privacy-safe) |
|---|---|---|---|---|
| SYS.REQUEST_MALFORMED | false | validation / 400 | err.sys.request_malformed | field path and rule only |
| COM.AMOUNT_INVALID | false | validation / 400 | err.com.amount_invalid | rule `amount_format` |
| NEG.TERMS_UNCHANGED | false | validation / 400 | err.neg.terms_unchanged | none |
| NEG.TERMS_OUT_OF_BOUNDS | false | validation / 400 | err.neg.terms_out_of_bounds | rule `ratio_bounds` |
| COM.QUOTE_MISSING | false | unprocessable_state / 422 | err.com.quote_missing | rule `quote_missing` |
| COM.QUOTE_EXPIRED | false | unprocessable_state / 422 | err.com.quote_expired | rule `quote_expired` |
| NEG.LISTING_INACTIVE | false | unprocessable_state / 422 | err.neg.listing_inactive | none |
| NEG.LISTING_CHANGED | false | conflict / 409 | err.neg.listing_changed | none |
| NEG.SELF_FORBIDDEN | false | unprocessable_state / 422 | err.neg.self_forbidden | none |
| NEG.ROUND_LIMIT | false | unprocessable_state / 422 | err.neg.round_limit | round number only |
| NEG.OPEN_EXISTS | false | conflict / 409 | err.neg.open_exists | none |
| NEG.ACTIVE_LIMIT | false | unprocessable_state / 422 | err.neg.active_limit | none |
| NEG.TERMS_HASH_MISMATCH | false | conflict / 409 | err.neg.terms_hash_mismatch | none |

No diagnostic includes listing titles, amounts, names or account IDs (CTR-ERR-001 R06).

## Authorization
Validation runs after authentication. Authorization failures (`SYS.NOT_FOUND`, `SYS.FORBIDDEN`) take precedence over state codes when the actor cannot read the negotiation (see [PS-010-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
- Validation is deterministic and side-effect free. Retrying a rejected request with the same key returns the same error without a new event.
- Offline queued commands are re-validated at server commit. Results follow the table above (D08).

## Privacy, retention, abuse
Rejected payloads are not persisted. Only the error code, rule and request ID are logged (CTR-ERR-001 R10). Ratio and count limits are the main abuse controls (see [PS-010-07](privacy_retention_abuse.md)).

## Observability & budgets
`negotiation_validation_rejections_total{code}`. Validation adds ≤ 2 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-010-02-01 (boundary): amount `0`, `01`, `1.0`, 39 vs 40 digits, `2500.00` all handled per R02.
- TEST-PS-010-02-02 (ratio): 0.09×, 0.10×, 10.00×, 10.01× boundaries.
- TEST-PS-010-02-03 (quote): cross-currency counter with no quote, expired quote, valid quote.
- TEST-PS-010-02-04 (listing change): accept after listing edit → `NEG.LISTING_CHANGED`, nothing persisted.
- TEST-PS-010-02-05 (self): seller opens on own listing; two pseudonyms of one account → `NEG.SELF_FORBIDDEN`.
- TEST-PS-010-02-06 (privacy scan): fuzzed inputs containing emails, addresses and coordinates produce error bodies free of them.

## Acceptance criteria
1. Every code in the table is registered in CTR-ERR-001 registry lint with matching category and HTTP status.
2. No validation path reads or echoes an input value.
3. TEST-PS-010-02-01 through -06 pass.

## Assumptions & open decisions
- ASSUMPTION: 0.10×–10.00× ratio bounds, 10-round cap, 20 active negotiations per initiator, 2 KiB payload limit.
- PROVISIONAL (D03 default, unapproved): quote-based normalization for cross-currency value comparison.
- OPEN (D04): valuation rules for in-kind compensation in ratio checks; MVP excludes in-kind from R05 and applies R05 to monetary terms only.
- Related: CTR-ERR-001 ASSUMPTION on `SYS.INTERNAL` defaults.

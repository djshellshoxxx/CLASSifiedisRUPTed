# PS-002-02 — Create validation and exact errors

**Status:** SPECIFIED_REVIEW_PENDING — architecture/security/protocol review outstanding; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Inherits [client-owned architecture](../../../planning/CLIENT_SIDE_ARCHITECTURE.md), [core commands/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md) and [listing contract](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md). These contracts supersede conflicting backend assumptions in historical parent text. Stable requirement/test IDs retained with explicitly revised local semantics.

## Requirements
- PS-002-02.R01: Input object <=256KiB UTF-8; reject unknown fields before mutation. Normalize NFC before counting Unicode code points; reject NUL, bidi override and unsupported controls; allow tab/newline in description only. Title if supplied must have 3..120 code points. Render escaped; free text cannot be guaranteed free of personal disclosures.
- PS-002-02.R02: Reject fractional/exponent/leading-plus/noncanonical money strings, amounts <=0 or >9000000000000000, unknown currency/exponent, noninteger quantity or quantity outside 1..100000. Wanted/giveaway forbid price and price_on_request=true. Missing title/area/sell price allowed for draft only; publish is separate validation.
- PS-002-02.R03: Validate optional area against release-pinned local catalog; manual choice works offline. Enforce selected local category/resource policy inside transaction, using stored version. Unavailable mandatory local policy returns POLICY_UNAVAILABLE without mutation; missing remote feed does not disable independent drafting. No inferred global goods approval or account ban.

## Errors and UX
CR-002 typed Problem, no HTTP dependency. MALFORMED_INPUT, PAYLOAD_TOO_LARGE, VALIDATION_FAILED `{field_errors:[{path,code}]}`, VAULT_LOCKED, FORBIDDEN, FEATURE_DISABLED, RATE_LIMITED_LOCAL, POLICY_UNAVAILABLE, STORAGE_UNAVAILABLE/STORAGE_QUOTA_EXCEEDED. Field codes TOO_LONG, TOO_SHORT, UNKNOWN_FIELD, INVALID_ENUM, INVALID_CURRENCY, INVALID_INTEGER, AMOUNT_OUT_OF_RANGE, AREA_INVALID, CATEGORY_NOT_ALLOWED. Error paths are schema paths, never echo unsafe input. Limit 32 field errors; request_id random local diagnostic ID. Inline localized summary, first-error focus and screenreader status.

## Acceptance
TEST-PS-002-02 covers exact boundary/fuzz cases, escaped XSS, hidden geo fields, unknown field rejection, offline catalog and local policy failure; no record/event/receipt on validation failure. Specified, not run.

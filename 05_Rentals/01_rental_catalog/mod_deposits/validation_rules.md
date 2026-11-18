# PS-040-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-02. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** notifications (localized messages), observability (error counters), client PWA (offline pending queue).

## Purpose and scope
Define every input check for deposit commands and queries, the exact error codes returned, and the order in which checks run. Validation rejects invalid input before any state change. Business state guards are listed here only where they produce a code. Error envelope shape follows CTR-ERR-001 (provisional, A-deposits-07).

## Requirements
- PS-040-02.R01: Business outcome: an invalid or unauthorized request is rejected with one stable, localized, privacy-safe error code and no state change. Exclusions: fraud scoring, identity verification, damage assessment, and FX checks (no FX in v1).
- PS-040-02.R02: Case coverage: invalid amounts, unknown or forbidden fields, expired terms, duplicate active deposit, stale revision, replayed idempotency key with different payload, and non-party access returning NOT_FOUND.
- PS-040-02.R03: Each message_key is localizable. Error text contains no amounts, no participant IDs and no rental details. Errors are readable by screen readers and do not rely on color.
- PS-040-02.R04: Check order is fixed: (1) schema_version, (2) unknown fields and format, (3) authentication, (4) existence and party membership (non-party gets DEPOSITS_NOT_FOUND), (5) role and capability, (6) expected_revision and state, (7) business guards that call dependencies.
- PS-040-02.R05: Money is validated as a JSON integer. Strings, floats and exponent notation are rejected. Arithmetic is integer only.
- PS-040-02.R06: Free-text keys are rejected by name (DEPOSITS_VALIDATION_FREE_TEXT_FORBIDDEN). Reason fields accept enumerated codes only.
- PS-040-02.R07: External references are opaque tokens. Values that look like account or card numbers (13 or more consecutive digits, or IBAN-like patterns) are rejected.

## Field rules
| Field | Rule | Error code on failure |
|---|---|---|
| amount_minor | JSON integer; >= 1; <= cap_minor(currency) | DEPOSITS_VALIDATION_AMOUNT_TYPE; DEPOSITS_VALIDATION_AMOUNT_NONPOSITIVE; DEPOSITS_VALIDATION_AMOUNT_OVER_CAP |
| currency_code | 3 uppercase letters; in allowlist | DEPOSITS_VALIDATION_CURRENCY_UNSUPPORTED |
| method_code | in enum | DEPOSITS_VALIDATION_METHOD_UNSUPPORTED |
| *_id fields | prefix, 26 chars, charset `[0-9A-HJKMNP-TV-Z]` (Crockford) | DEPOSITS_VALIDATION_ID_FORMAT |
| any undeclared key | rejected | DEPOSITS_VALIDATION_FIELD_UNKNOWN |
| any free-text key | rejected | DEPOSITS_VALIDATION_FREE_TEXT_FORBIDDEN |
| reason_code | in enum for the command | DEPOSITS_VALIDATION_REASON_CODE_UNKNOWN |
| withheld_minor | 0 to amount_minor | DEPOSITS_VALIDATION_WITHHOLD_EXCEEDS_AMOUNT |
| returned_minor, withheld_minor (partial outcome) | sum equals amount_minor | DEPOSITS_VALIDATION_SETTLEMENT_SUM_MISMATCH |
| external_ref | 8 to 128 chars; pattern; no account or card pattern | DEPOSITS_VALIDATION_EXTERNAL_REF_FORMAT |
| evidence_kind | allowed for current state (see workflow_state_machine.md) | DEPOSITS_VALIDATION_EVIDENCE_KIND_UNSUPPORTED |
| evidence count | at most 5 rows per deposit per submitter | DEPOSITS_VALIDATION_EVIDENCE_LIMIT |
| schema_version | equals 1 | DEPOSITS_VALIDATION_SCHEMA_VERSION |
| limit (list queries) | 1 to 50 | DEPOSITS_VALIDATION_LIST_LIMIT |

## Error codes
| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DEPOSITS_VALIDATION_AMOUNT_TYPE | 400 | no | amount not a JSON integer |
| DEPOSITS_VALIDATION_AMOUNT_NONPOSITIVE | 400 | no | amount_minor < 1 |
| DEPOSITS_VALIDATION_AMOUNT_OVER_CAP | 400 | no | amount_minor > cap |
| DEPOSITS_VALIDATION_CURRENCY_UNSUPPORTED | 400 | no | currency not allowed |
| DEPOSITS_VALIDATION_METHOD_UNSUPPORTED | 400 | no | method not allowed |
| DEPOSITS_VALIDATION_ID_FORMAT | 400 | no | malformed identifier |
| DEPOSITS_VALIDATION_FIELD_UNKNOWN | 400 | no | undeclared field, including client-supplied party IDs |
| DEPOSITS_VALIDATION_FREE_TEXT_FORBIDDEN | 400 | no | free-text field sent |
| DEPOSITS_VALIDATION_REASON_CODE_UNKNOWN | 400 | no | reason code not in enum |
| DEPOSITS_VALIDATION_WITHHOLD_EXCEEDS_AMOUNT | 400 | no | withheld_minor > amount_minor |
| DEPOSITS_VALIDATION_SETTLEMENT_SUM_MISMATCH | 400 | no | returned + withheld != amount |
| DEPOSITS_VALIDATION_EXTERNAL_REF_FORMAT | 400 | no | external_ref invalid or looks like account data |
| DEPOSITS_VALIDATION_EVIDENCE_KIND_UNSUPPORTED | 400 | no | evidence kind not allowed in this state |
| DEPOSITS_VALIDATION_EVIDENCE_LIMIT | 422 | no | evidence count exceeded |
| DEPOSITS_VALIDATION_SCHEMA_VERSION | 400 | no | unsupported schema_version |
| DEPOSITS_VALIDATION_LIST_LIMIT | 400 | no | list limit outside 1 to 50 |
| DEPOSITS_STATE_RENTAL_INELIGIBLE | 422 | no | rental_status does not allow this action |
| DEPOSITS_STATE_TERMS_EXPIRED | 422 | no | terms expired before accept |
| DEPOSITS_STATE_COUNTER_LIMIT | 422 | no | 5 term revisions already exist |
| DEPOSITS_STATE_DISPUTE_ALREADY_OPEN | 409 | no | dispute already open |
| DEPOSITS_STATE_TRANSITION_NOT_ALLOWED | 409 | no | command not valid in current state |
| DEPOSITS_CONFLICT_REVISION_MISMATCH | 409 | yes, after re-read | expected_revision is stale |
| DEPOSITS_CONFLICT_ACTIVE_DEPOSIT_EXISTS | 409 | no | another non-terminal deposit exists for rental_ref |
| DEPOSITS_CONFLICT_IDEMPOTENCY_PAYLOAD_MISMATCH | 422 | no | same key, different payload |
| DEPOSITS_NOT_FOUND | 404 | no | record absent, or caller is not a party |
| DEPOSITS_FORBIDDEN_ROLE | 403 | no | party lacks role for this action |
| DEPOSITS_FORBIDDEN_REVOKED | 403 | no | capability revoked or identity blocked |
| DEPOSITS_RATE_LIMITED | 429 | yes, after Retry-After | rate limit exceeded |
| DEPOSITS_DEPENDENCY_UNAVAILABLE | 503 | yes | rental or identity read failed |
| DEPOSITS_INTERNAL | 500 | yes | unexpected server error |

Error body (example): `{"error":{"code":"DEPOSITS_VALIDATION_AMOUNT_OVER_CAP","retryable":false,"field":"amount_minor","message_key":"deposits.amount.over_cap","diagnostic_id":"dgn_01JZ8Q0R1S2T3V4W5X6Y7Z8A9B"}}`

## Assumptions and open decisions
- A-deposits-05: Amounts are JSON integers only.
- A-deposits-06: No free text in v1.
- A-deposits-07: Error prefix DEPOSITS_ and envelope are provisional under CTR-ERR-001 (owner F15).
- A-deposits-09: Counter limit of 5 term revisions.
- A-deposits-24: Rate limits listed in privacy_retention_abuse.md.
- Open: DEPOSITS_VALIDATION_EXTERNAL_REF_FORMAT pattern set is a first-pass denylist. Final patterns depend on CTR-COM-001 reference format (F09).

## Test cases
- TEST-PS-040-02-T01: Submit amount_minor as "25000" (string). Pass: 400 DEPOSITS_VALIDATION_AMOUNT_TYPE, no row written. Fail: any other result.
- TEST-PS-040-02-T02: Submit receiver-supplied depositor_participant_id on create. Pass: 400 DEPOSITS_VALIDATION_FIELD_UNKNOWN. Fail: request accepted.
- TEST-PS-040-02-T03: Non-party reads a deposit by ID. Pass: 404 DEPOSITS_NOT_FOUND, body identical to a missing ID. Fail: 403 or a body that differs.

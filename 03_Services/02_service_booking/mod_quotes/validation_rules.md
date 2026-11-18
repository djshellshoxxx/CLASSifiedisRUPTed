# PS-032-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-02. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines input validation, business-rule validation, evaluation order and the typed error catalogue for quote commands. Business outcome: every rejected input returns one stable, localizable error code with no personal data, and no invalid quote can reach the issued state.

Exclusions: authorization decisions (authorization_capabilities.md), state transition legality (workflow_state_machine.md), and retry behavior (failure_recovery_idempotency.md). Validation does not verify that a counterparty will perform, pay or deliver anything.

## Requirements
- PS-032-02.R01: Validation rejects, never silently coerces, every malformed value. Unknown JSON fields are rejected with `QUOTES_REQUEST_INVALID`.
- PS-032-02.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial inputs are enumerated in Section 5 and tested in TEST-PS-032-02-T01 to T06.
- PS-032-02.R03: Error messages are returned as `message_key` values for localization. Error text is never a raw personal value. Budgets are in observability_performance.md.
- PS-032-02.R04: Validation runs in the fixed order in Section 2. A later check never runs when an earlier check fails.
- PS-032-02.R05: The error catalogue in Section 3 is complete for the module. Each code is returned by at least one test.

## 1. Field rules
| Field | Rule | Error code on failure |
|---|---|---|
| request_ref | `^[A-Za-z0-9_-]{8,64}$`; existence confirmed by owner read | QUOTES_REQUEST_REF_INVALID |
| service_ref | `^[a-z0-9_]{8,64}$`; exists in catalog | QUOTES_SERVICE_REF_INVALID |
| requester_participant_id | `^[a-z0-9_]{8,64}$`; not equal to provider | QUOTES_SELF_QUOTE |
| currency_code | ISO 4217 alpha-3 uppercase; in allowlist (A-quotes-02) | QUOTES_CURRENCY_UNSUPPORTED |
| counter currency | equals revision `currency_code` | QUOTES_CURRENCY_MISMATCH |
| total or unit amounts | integer; 0..99999999999; JSON number or decimal string rejected (integer JSON only) | QUOTES_AMOUNT_OUT_OF_RANGE |
| line_items | 1..50 items at issue; 0..50 while composing | QUOTES_LINE_LIMIT_EXCEEDED, QUOTES_LINE_EMPTY |
| quantity_milli | integer 1..1000000000 | QUOTES_QUANTITY_OUT_OF_RANGE |
| line_total_minor | `quantity_milli × unit_price_minor / 1000` exact integer | QUOTES_LINE_TOTAL_NOT_EXACT |
| description | 1..280 chars after NFC; no control characters other than none; no leading or trailing whitespace | QUOTES_DESCRIPTION_INVALID |
| service_item_code | `^[a-z0-9_]{1,64}$` when present | QUOTES_ITEM_CODE_INVALID |
| notes | 0..1000 chars after NFC | QUOTES_NOTES_TOO_LONG |
| counter_note | 0..500 chars after NFC | QUOTES_COUNTER_NOTE_TOO_LONG |
| valid_until | at issue: now + 1 hour ≤ value ≤ now + 90 days; default now + 14 days if omitted at issue (A-quotes-04) | QUOTES_VALIDITY_OUT_OF_RANGE |
| expected_version | integer ≥ 1 | QUOTES_REQUEST_INVALID |
| Idempotency-Key header | 1–64 chars `[A-Za-z0-9_-]` | QUOTES_IDEMPOTENCY_KEY_REQUIRED |
| schema_version | major equals 1; minor ≤ server minor | QUOTES_SCHEMA_VERSION_UNSUPPORTED |
| cursor, limit | opaque cursor; `limit` 1..50, default 25 | QUOTES_CURSOR_INVALID, QUOTES_LIMIT_EXCEEDED |

## 2. Evaluation order
1. Feature flag `quotes.enabled` (A-quotes-25). Off returns `QUOTES_FEATURE_DISABLED`.
2. Authentication. Missing or invalid session returns the platform identity error (CTR-ERR-001), not a QUOTES code.
3. Idempotency-Key presence and format for state-changing commands.
4. Rate limit (A-quotes-13).
5. Resource visibility. A caller who is not a party gets `QUOTES_NOT_FOUND` (authorization_capabilities.md R04).
6. Capability check. Failure returns `QUOTES_NOT_AUTHORIZED`.
7. Schema version and request shape (unknown fields, types, lengths, ranges).
8. Field rules from Section 1.
9. Idempotency replay or key-reuse check (failure_recovery_idempotency.md).
10. State guards (workflow_state_machine.md) and business rules in Section 4.

## 3. Error catalogue
Every error is returned in the CTR-ERR-001 shape: `code`, `retryable`, `message_key`, `diagnostic_id`. HTTP status is the suggested binding.

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUOTES_FEATURE_DISABLED | 503 | yes, later | Module flag off |
| QUOTES_IDEMPOTENCY_KEY_REQUIRED | 400 | no | Header missing or malformed |
| QUOTES_IDEMPOTENCY_KEY_REUSED | 409 | no | Same key, different request hash |
| QUOTES_SCHEMA_VERSION_UNSUPPORTED | 400 | no | Major mismatch |
| QUOTES_REQUEST_INVALID | 400 | no | Malformed body or unknown field |
| QUOTES_CURSOR_INVALID | 400 | no | Cursor tampered or expired |
| QUOTES_LIMIT_EXCEEDED | 400 | no | `limit` above 50 |
| QUOTES_REQUEST_REF_INVALID | 422 | no | Format or owner lookup failed |
| QUOTES_SERVICE_REF_INVALID | 422 | no | Unknown catalog entry |
| QUOTES_SELF_QUOTE | 422 | no | Requester equals provider |
| QUOTES_CURRENCY_UNSUPPORTED | 422 | no | Not in allowlist |
| QUOTES_CURRENCY_MISMATCH | 422 | no | Counter currency differs |
| QUOTES_AMOUNT_OUT_OF_RANGE | 422 | no | Amount outside 0..99999999999 or not integer |
| QUOTES_LINE_LIMIT_EXCEEDED | 422 | no | More than 50 lines |
| QUOTES_LINE_EMPTY | 422 | no | Issue attempted with zero lines |
| QUOTES_QUANTITY_OUT_OF_RANGE | 422 | no | `quantity_milli` outside 1..1000000000 |
| QUOTES_LINE_TOTAL_NOT_EXACT | 422 | no | Line total has a fractional minor unit |
| QUOTES_DESCRIPTION_INVALID | 422 | no | Length or character rule |
| QUOTES_ITEM_CODE_INVALID | 422 | no | Code pattern |
| QUOTES_NOTES_TOO_LONG | 422 | no | Notes over 1000 chars |
| QUOTES_COUNTER_NOTE_TOO_LONG | 422 | no | Counter note over 500 chars |
| QUOTES_VALIDITY_OUT_OF_RANGE | 422 | no | `valid_until` outside bounds |
| QUOTES_DUPLICATE_OPEN_QUOTE | 409 | no | Non-terminal quote already exists for pair (A-quotes-07) |
| QUOTES_REVISION_LIMIT_REACHED | 409 | no | 20 revisions already exist |
| QUOTES_OPEN_QUOTE_LIMIT_REACHED | 429 | yes, after `retry_after` | Provider open-quote cap (A-quotes-13) |
| QUOTES_RATE_LIMITED | 429 | yes, after `retry_after` | Command rate limit |
| QUOTES_NOT_FOUND | 404 | no | Quote absent or caller is not a party |
| QUOTES_NOT_AUTHORIZED | 403 | no | Capability missing |
| QUOTES_PARTY_BLOCKED | 403 | no | Block between parties (A-quotes-12) |
| QUOTES_STATE_INVALID | 409 | no | Command not allowed in current status |
| QUOTES_VERSION_CONFLICT | 409 | yes, after re-read | `expected_version` stale |
| QUOTES_REVISION_STALE | 409 | no | Response names superseded revision |
| QUOTES_REVISION_EXPIRED | 409 | no | `valid_until` ≤ server now |
| QUOTES_CONSENT_HASH_MISMATCH | 409 | no | Acknowledged hash differs from revision hash |
| QUOTES_COUNTER_LIMIT_REACHED | 409 | no | Three counters already recorded |
| QUOTES_MODERATION_HOLD | 409 | no | Issue or ACCEPT blocked by hold |
| QUOTES_DEPENDENCY_TIMEOUT | 503 | yes | Identity, catalog or request owner read timed out |
| QUOTES_INTERNAL | 500 | yes | Unexpected server fault; `diagnostic_id` only |

## 4. Business rules
- BR1: Issue requires at least one line, `valid_until` in range, `moderation_hold` false, and provider not blocked by requester (fail closed, A-quotes-12).
- BR2: Revision totals are recomputed by the server from line items. Client-supplied totals are ignored (adversarial case, see domain_schema.md TEST-PS-032-01-T05).
- BR3: A zero-total revision is valid (giveaway journey). Negative values are never valid.
- BR4: Counter amount must differ from the currently issued total. Equal values return `QUOTES_REQUEST_INVALID`.

## 5. Normal, invalid and adversarial inputs
| Class | Input | Expected result | Test |
|---|---|---|---|
| normal | Valid create with one line, EUR, 2000 × 4500 | 201, total 9000 | T01 |
| invalid | `unit_price_minor` as `45.00` | QUOTES_AMOUNT_OUT_OF_RANGE | T02 |
| invalid | `quantity_milli` 1 with `unit_price_minor` 1 | QUOTES_LINE_TOTAL_NOT_EXACT | T03 |
| invalid | Currency `XXX` not allowlisted | QUOTES_CURRENCY_UNSUPPORTED | T04 |
| expired | `valid_until` 30 minutes after issue | QUOTES_VALIDITY_OUT_OF_RANGE | T05 |
| adversarial | Notes with 1001 characters; unknown field `total_override` | QUOTES_NOTES_TOO_LONG; QUOTES_REQUEST_INVALID | T06 |

Duplicate and concurrent input cases are covered by the state and failure specifications.

## Assumptions and open decisions
- A-quotes-04: Validity bounds are minimum 1 hour, default 14 days, maximum 90 days from issue.
- Error codes are provisional until CTR-ERR-001 is expanded by F15. The codes above use the `QUOTES_` prefix and are stable within this module.
- D05 (open, DECISIONS.md): geoprivacy does not affect validation in this file because no precise location field exists.

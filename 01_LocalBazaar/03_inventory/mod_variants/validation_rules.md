# PS-009-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-EVT-001. Module code `VARIANT` (PENDING CTR-ERR-001 registry).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-02.R01 | Validation order is fixed: authorization, envelope and schema, normalisation, key/value rules, uniqueness, listing state. The first failure is returned; no others. | MVP |
| PS-009-02.R02 | Input values are never echoed in errors (CTR-ERR-001 R07). `details[].rule` is a registry enum. | MVP |
| PS-009-02.R03 | PII heuristic: values matching an email, phone-number or URL pattern are rejected with rule `pii_pattern`. Heuristic only; it is not a guarantee. | MVP |
| PS-009-02.R04 | Writes to a listing whose revision differs from `expected_revision` are rejected before field rules run. | MVP |

## Data / schema
Not applicable beyond PS-009-01. Rule parameters: `max_variants=25`, `max_attributes=3`, `value_max_len=40` (ASSUMPTION).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| VARIANT.LIMIT_EXCEEDED | unprocessable_state (422) | false | 26th active variant | max_variants |
| VARIANT.KEY_UNKNOWN | validation (400) | false | key not in registry | key_registry |
| VARIANT.VALUE_INVALID | validation (400) | false | empty, too long, control characters, PII pattern | value_length, control_char, pii_pattern |
| VARIANT.DUPLICATE_COMBINATION | unprocessable_state (422) | false | attribute set equals an active variant | unique_combination |
| VARIANT.IN_USE | unprocessable_state (422) | false | update of a variant referenced by an open proposal | referenced_open |
| VARIANT.ARCHIVED | unprocessable_state (422) | false | update of an archived variant | status |

Message keys follow CTR-ERR-001 R05 (for example `err.variant.limit_exceeded`). No localised prose is sent.

## Authorization
Validation runs after the actor has passed PS-009-05. An unreadable listing returns `SYS.NOT_FOUND`, not a validation error.

## Failure, idempotency, concurrency, offline
Rejections are deterministic for the same input and state. They are not retried automatically; clients re-read the listing before correcting input.

## Privacy, retention, abuse
Rejections log the code and request ID only (CTR-ERR-001 R10).

## Observability & budgets
Count rejections per code; alert rule is in PS-009-08.

## Tests
- TEST-PS-009-02-01 (unit): each code triggered by one minimal fixture.
- TEST-PS-009-02-02 (property): rule order is stable when several rules fail.
- TEST-PS-009-02-03 (negative): PII-like strings (email, phone, URL) rejected; ordinary words accepted.

## Acceptance criteria
1. Each code in the table is produced by its trigger and by no other input.
2. No error response contains the submitted value.
3. `retryable` is false for every `VARIANT.*` code.

## Assumptions & open decisions
- ASSUMPTION: the PII heuristic blocks obvious personal data only; F10 must review false positives.
- PENDING CTR-ERR-001: registration of `VARIANT` module code.
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.

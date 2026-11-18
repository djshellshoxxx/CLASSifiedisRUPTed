# PS-102-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001 (template schemas), CTR-PRV-001 (R09 diagnostics), CTR-ID-001.

**Decision labels:** Disposable-domain list and rate limits are PROVISIONAL (D10 default, unapproved; abuse thresholds for F12 review).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-02.R01 | Address: RFC 5321 local-part and domain syntax, total length ≤ 254, IDN domains stored as punycode ASCII. Failure → `EMAIL.ADDRESS_INVALID`. | MVP |
| PS-102-02.R02 | Normalization: domain lowercased; local part kept as entered for delivery, compared case-insensitively for uniqueness (ASSUMPTION). | MVP |
| PS-102-02.R03 | Header fields: no CR, LF or NUL. Subject ≤ 78 characters, from a template catalog only. Violation → `EMAIL.HEADER_INVALID`. | MVP |
| PS-102-02.R04 | Template ID must exist in catalog with matching version; variables allowlisted per template. Else `EMAIL.TEMPLATE_UNKNOWN`. | MVP |
| PS-102-02.R05 | Body variables may contain no listing content, counterparty names or coordinates (CTR-PRV-001 R03). Violation rejected at template render. | MVP |
| PS-102-02.R06 | Links in bodies: HTTPS only, host on first-party allowlist. Else `EMAIL.LINK_NOT_ALLOWED`. | MVP |
| PS-102-02.R07 | Verification token: exact format `vtk_` + 43 base64url characters; expired or used → `EMAIL.VERIFICATION_EXPIRED` / `EMAIL.VERIFICATION_USED`. | MVP |
| PS-102-02.R08 | Address disposable-domain list match → `EMAIL.ADDRESS_DISPOSABLE` for account-creation categories only. | MVP |

## Data / schema
Template catalog entries (CTR-SCH-001): `template_id`, `version`, `subject_key`, `allowed_variables[]`, `category` (see PS-107-01 categories), `sha256`. Schema-level constraints: `additionalProperties: false`.

## Commands / queries / events
Applies to `eml.bind`, `eml.verify`, `eml.send` (PS-102-04).

## States & transitions
Validation failure creates no state change and no event.

## Validation & errors
| Code | Retryable | Category / HTTP | Message key |
|---|---|---|---|
| EMAIL.ADDRESS_INVALID | false | validation / 400 | err.email.address_invalid |
| EMAIL.ADDRESS_DISPOSABLE | false | validation / 400 | err.email.address_disposable |
| EMAIL.HEADER_INVALID | false | validation / 400 | err.email.header_invalid |
| EMAIL.TEMPLATE_UNKNOWN | false | validation / 400 | err.email.template_unknown |
| EMAIL.LINK_NOT_ALLOWED | false | validation / 400 | err.email.link_not_allowed |
| EMAIL.VERIFICATION_EXPIRED | false | validation / 400 | err.email.verification_expired |
| EMAIL.VERIFICATION_USED | false | conflict / 409 | err.email.verification_used |
| EMAIL.RATE_LIMITED | true | rate / 429 | err.email.rate_limited |

Diagnostics: field path and rule only. The submitted address is never echoed (CTR-ERR-001 R07).

## Authorization
Validation runs after the capability check; unauthorized callers get `SYS.NOT_FOUND` (PS-102-05).

## Failure, idempotency, concurrency, offline
Validation is deterministic and side-effect free; retries of rejected input are not retried by the system.

## Privacy, retention, abuse
Disposable and header checks are abuse controls; their logs record code only.

## Observability and budgets
Rejected counts by code; validation p95 ≤ 10 ms (ASSUMPTION).

## Tests
- TEST-PS-102-03 (unit): 254-character address accepted; 255 rejected.
- TEST-PS-102-04 (negative): address with CRLF in local part rejected with `EMAIL.HEADER_INVALID`.
- TEST-PS-102-05 (negative): template variable containing a coordinate string rejected.

## Acceptance criteria
1. Each code in the table has a fixture.
2. No response echoes an address or variable value.
3. Link allowlist test passes for all catalog templates.

## Assumptions & open decisions
- ASSUMPTION: RFC 5321 syntax subset is sufficient; quoted local parts are rejected.
- D10 (PROVISIONAL, unapproved). D05 geoprivacy: no location variables allowed.

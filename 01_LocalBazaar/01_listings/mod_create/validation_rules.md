# PS-002-02 — Create validation and exact errors

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-02.R01: Validate JSON object <=256KiB with no unknown fields; NFC normalization before 3..120 Unicode character title limit; reject NUL, bidi override and unsupported control codepoints, sanitize on HTML render.
- PS-002-02.R02: Reject decimal/floating/exponent money and price <=0; positive quantity integer 1..100000; giveaway has no price; allow drafts missing description/title/area; publication gate later requires title and approved coarse area.
- PS-002-02.R03: Server validates requested public_area_id against F06 catalog. F18 category policy and F12 rate/account restrictions checked before insert; fail closed for unavailable required policy. Never accept exact addresses or coordinates in public listing JSON.
## Errors
400 MALFORMED_JSON for invalid JSON; 413 PAYLOAD_TOO_LARGE; 422 VALIDATION_FAILED with field_errors array of JSON-pointer path and stable TOO_LONG, UNKNOWN_FIELD, INVALID_ENUM, INVALID_CURRENCY, INVALID_INTEGER, AMOUNT_OUT_OF_RANGE, AREA_INVALID, CATEGORY_NOT_ALLOWED; 401 UNAUTHENTICATED; 403 FEATURE_DISABLED/FORBIDDEN; 429 RATE_LIMITED with Retry-After; 503 DEPENDENCY_UNAVAILABLE for policy DB outage. No echo of unsafe content.
## UX/tests
Inline localized field summary and focus first error. TEST-PS-002-02 boundary and fuzz Unicode, XSS text, invalid currency, hidden geo fields, policy outage. No tests run.

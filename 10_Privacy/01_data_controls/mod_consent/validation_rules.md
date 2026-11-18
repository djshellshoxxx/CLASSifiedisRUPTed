# PS-076-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-02.R01 | Reject any `purpose` not in the closed registry with `CONSENT.PURPOSE_UNKNOWN` (400) before any write. | MVP |
| PS-076-02.R02 | Reject a grant whose `notice_version` differs from the current notice for that purpose with `CONSENT.NOTICE_VERSION_STALE` (409). | MVP |
| PS-076-02.R03 | Reject a grant covering two or more purposes in one request unless each purpose has its own toggle (`CONSENT.BUNDLED_NOT_ALLOWED`, 422). | MVP |
| PS-076-02.R04 | Reject `scope.ref` that is not an ID of the expected prefix or does not exist as a readable object (`SYS.NOT_FOUND`, identical for unreadable, CTR-ERR-001 R08). | MVP |
| PS-076-02.R05 | Reject payloads > 4 KiB or depth > 3 (`SYS.PAYLOAD_TOO_LARGE`, 413). | MVP |

## Data / schema
Validation runs against the schema in [domain_schema.md](domain_schema.md). Input values are never echoed in errors (CTR-ERR-001 R07); `details[].rule` uses registry enums such as `enum_closed`, `stale_version`, `bundled`, `ref_prefix`.

## Commands / queries / events
Applies to `consent.grant`, `consent.withdraw`, `consent.query` in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Withdrawal (`consent.withdraw`) is validated only for existence and ownership, not for notice version. Withdrawal of an already withdrawn record returns the existing result (see file 06), not an error.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| CONSENT.PURPOSE_UNKNOWN | false | validation / 400 | R01 |
| CONSENT.NOTICE_VERSION_STALE | false | conflict / 409 | R02; client re-fetches notice |
| CONSENT.BUNDLED_NOT_ALLOWED | false | unprocessable_state / 422 | R03 |
| CONSENT.SCOPE_INVALID | false | validation / 400 | R04 prefix mismatch |
| CONSENT.EXPIRY_OUT_OF_RANGE | false | validation / 400 | `expires_at` > 365 d |

Privacy-safe diagnostic: log code, request_id, purpose enum only.

## Authorization
Validation runs after authentication and before decision. Failed validation for an object the actor cannot read returns `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Validation is deterministic; the same input yields the same error. Offline-queued grants are re-validated at server commit (CTR-CAP-001 Failure section); a stale notice fails at commit, not at queue time.

## Privacy, retention, abuse
No personal data is logged from validation. Repeated `NOTICE_VERSION_STALE` from one subject raises an alert (ASSUMPTION threshold 20/h).

## Observability & budgets
Counter `consent_validation_failures_total{code}`. Validation p95 ≤ 2 ms (ASSUMPTION).

## Tests
- TEST-PS-076-02-01 (unit): each R01–R05 rule returns its code and HTTP status.
- TEST-PS-076-02-02 (negative): unknown purpose and mismatched prefix never write a row.
- TEST-PS-076-02-03 (privacy): error bodies contain no input value.

## Acceptance criteria
1. Each of R01–R05 has a passing test.
2. No validation error echoes input values.
3. Stale notice grant is rejected with 409 in 100% of cases in the test matrix.

## Assumptions & open decisions
- ASSUMPTION: abuse thresholds above are placeholders for F10 validation.
- PROVISIONAL (D07 default, unapproved): retention rules do not affect validation.

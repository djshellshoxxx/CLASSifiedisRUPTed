# PS-080-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R06), CTR-ERR-001 (R06, R07), CTR-PRV-001 (R03, R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-02.R01 | Attachment with a format outside the MVP allowlist (JPEG, PNG, WebP) → `META.UNSUPPORTED_FORMAT` (422). PDF and HEIC are documented deferrals (Future). | MVP |
| PS-080-02.R02 | Any outbound payload field not in the surface allowlist → `META.DISALLOWED_FIELD` (422) at egress; CI fixture failure at build time. | MVP |
| PS-080-02.R03 | Event envelope containing an actor name, email, IP, device identifier or coordinates → `EVT.ENVELOPE_INVALID` (400) (CTR-EVT-001 R06). | MVP |
| PS-080-02.R04 | Attachment whose sanitizer output still contains a GPS or author tag → `META.STRIP_FAILED` (500, not retryable); file quarantined. | MVP |
| PS-080-02.R05 | Request with an unknown `policy_version` for egress → `META.POLICY_VERSION_MISMATCH` (409). | MVP |

## Data / schema
Inputs: file bytes (≤ 25 MiB, ASSUMPTION), declared MIME type (checked against magic bytes), outbound payload object.

## Commands / queries / events
Applies to `metadata.sanitize_attachment` (sys) and egress filter (all outbound surfaces).

## States & transitions
Rejected attachments move to `rejected` (see PS-080-03); payloads rejected at egress are not sent.

## Validation & errors
| Code | Retryable | Category / HTTP | Rule |
|---|---|---|---|
| META.UNSUPPORTED_FORMAT | false | unprocessable_state / 422 | R01 |
| META.DISALLOWED_FIELD | false | unprocessable_state / 422 | R02 |
| META.STRIP_FAILED | false | internal / 500 | R04 |
| META.POLICY_VERSION_MISMATCH | false | conflict / 409 | R05 |

Diagnostics report field names by category, never values (CTR-ERR-001 R06).

## Authorization
Validation runs in the sanitizer's `sys_` context; users cannot bypass it.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Magic-byte mismatch is treated as unsupported format.

## Privacy, retention, abuse
Rejected files are deleted within 1 h (RET-EPH) and their hashes kept 7 days to block re-upload of known-bad files (ASSUMPTION).

## Observability & budgets
`meta_validation_rejections_total{rule}`.

## Tests
- TEST-PS-080-02-01 (unit): each rule R01–R05 positive and negative.
- TEST-PS-080-02-02 (abuse): PDF upload rejected with `META.UNSUPPORTED_FORMAT`.

## Acceptance criteria
1. Every code in CTR-ERR-001 registry.
2. Quarantined files never served (TEST-PS-080-02-01).
3. Diagnostics contain no field values (negative fixture).

## Assumptions & open decisions
- ASSUMPTION: 25 MiB size cap; 7-day hash block list.
- Deferred: PDF and HEIC sanitisation (Future; documented here).

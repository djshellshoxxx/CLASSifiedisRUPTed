# PS-056-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (codes, `message_key`), CTR-PRV-001 (no precise location, no contact data in public fields), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-02.R01 | `bio`: NFC; ≤ 500 code points; no control characters except newline (max 5 newlines). | MVP |
| PS-056-02.R02 | `bio` and `languages` must not contain contact patterns: email, phone number (E.164-like, ≥ 7 digits), URL, messenger handle prefix (`@`, `t.me/`, `wa.me/`). Match → reject. | MVP |
| PS-056-02.R03 | `languages`: each entry matches BCP 47 well-formed syntax and is in the supported locale list (F14); duplicates removed; max 5. | MVP |
| PS-056-02.R04 | `region_cell`: must exist in the registry grid and have ≥ K_MIN (5) active profiles or be unpublished. Otherwise reject with `PROF.REGION_UNAVAILABLE`. | MVP |
| PS-056-02.R05 | `contact_methods`: each `value` validated by its `type` (email RFC 5322 subset, phone E.164, messenger handle regex); ≤ 3 entries. | MVP |
| PS-056-02.R06 | A `public` visibility on a `contact_methods` field is rejected (`PROF.CONTACT_NOT_PUBLIC`). | MVP |
| PS-056-02.R07 | Validation runs server-side on every write; response contains field path and rule, never the value. | MVP |

## Data / schema
Maps to fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `UpdateProfile` and `SetFieldVisibility` in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Validation precedes writes. Rejected writes leave `revision` unchanged. No state transitions are validated here.

## Validation & errors
| Code | Trigger | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|---|
| `PROF.BIO_INVALID` | R01 | false | `err.profile.bio_invalid` | `length` or `pattern` |
| `PROF.BIO_CONTACT` | R02 | false | `err.profile.bio_contact` | `forbidden_content` |
| `PROF.LANGUAGE_INVALID` | R03 | false | `err.profile.language_invalid` | `pattern` |
| `PROF.REGION_UNAVAILABLE` | R04 | true (when K_MIN reached) | `err.profile.region_unavailable` | `k_min` |
| `PROF.CONTACT_INVALID` | R05 | false | `err.profile.contact_invalid` | `pattern` |
| `PROF.CONTACT_NOT_PUBLIC` | R06 | false | `err.profile.contact_not_public` | `visibility` |

Module code is `PROF` (CTR-ERR-001 R02: 2–8 uppercase letters). The `message_key` prefix is `err.prof.*`.

## Authorization
Validation does not authorize; owner-only write is enforced first (PS-056-05).

## Failure, idempotency, concurrency, offline
Deterministic for same input and registry version. Offline clients pre-validate with cached registry; server result authoritative.

## Privacy, retention, abuse
Rejected values are never logged. Contact-pattern hits increment an abuse counter by pattern type only.

## Observability & budgets
`prof_validation_fail_total{code}`; validation p95 ≤ 5 ms.

## Tests
- TEST-PS-056-02-01 (unit): table of bio, language and contact cases.
- TEST-PS-056-02-02 (property): every accepted `bio` contains no pattern match after normalization.
- TEST-PS-056-02-03 (negative): public contact field rejected; error has no echo.
- TEST-PS-056-02-04 (privacy scan): contact-laden fixtures produce no value in any response or log.

## Acceptance criteria
1. Accepted profiles pass all rules; each rejection returns the listed code.
2. No echo of input in any error body (fixture scan).
3. Region validation enforces K_MIN.
4. Public contact fields impossible through API (schema and server check).

## Assumptions & open decisions
- ASSUMPTION: pattern-based contact detection is a heuristic; residual leakage is listed in PS-056-07.
- PROVISIONAL (D05 default, unapproved): coarse region grid and K_MIN = 5.

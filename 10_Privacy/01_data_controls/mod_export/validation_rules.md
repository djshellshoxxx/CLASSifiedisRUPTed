# PS-078-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001 (R03, R11), CTR-CAP-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-02.R01 | `scope` outside the closed enum → `EXPORT.SCOPE_INVALID` (400). | MVP |
| PS-078-02.R02 | Export request authentication age ≤ 10 min (ASSUMPTION); else `EXPORT.REAUTH_REQUIRED` (401). | MVP |
| PS-078-02.R03 | `include_precise_location: true` requires `precise_location_confirmation` equal to the literal string of the UI disclosure version; missing or stale → `EXPORT.PRECISE_LOCATION_NOT_CONFIRMED` (422). | MVP |
| PS-078-02.R04 | Body containing `subject_acc_id` or any counterparty ID filter → `SYS.REQUEST_MALFORMED` (400). | MVP |
| PS-078-02.R05 | Download token must match the stored SHA-256 hash in constant time; mismatch → `SYS.NOT_FOUND`. | MVP |
| PS-078-02.R06 | A second request while one is non-terminal → `EXPORT.ALREADY_GENERATING` (409) with the existing `dsr_` in details. | MVP |

## Data / schema
Inputs: `scope` (enum), `include_precise_location` (bool), `precise_location_confirmation` (string ≤ 64 chars), `download_token` (base64url, 43 chars).

## Commands / queries / events
Applies to `privacy.export.request` and `privacy.export.download` (PS-078-04).

## States & transitions
Rejected input creates no row and no event.

## Validation & errors
| Code | Retryable | Category / HTTP | Rule |
|---|---|---|---|
| EXPORT.SCOPE_INVALID | false | validation / 400 | R01 |
| EXPORT.REAUTH_REQUIRED | false | unauthenticated / 401 | R02 |
| EXPORT.PRECISE_LOCATION_NOT_CONFIRMED | false | unprocessable_state / 422 | R03 |
| EXPORT.ALREADY_GENERATING | false | conflict / 409 | R06 |
| EXPORT.TOKEN_CONSUMED | false | gone / 410 | Second download with valid token after single use |

## Authorization
Validation after authentication. Subject is taken from the principal only (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Validation is deterministic. Token comparison is constant-time to avoid timing oracles.

## Privacy, retention, abuse
Rejected bodies are not logged. Confirmation strings are stored as version identifiers, not free text.

## Observability & budgets
`export_validation_rejections_total{rule}`; validation p95 ≤ 20 ms.

## Tests
- TEST-PS-078-02-01 (unit): one positive and one negative case per rule R01–R06.
- TEST-PS-078-02-02 (security): wrong token and near-miss token both return `SYS.NOT_FOUND` with identical bodies.

## Acceptance criteria
1. Each code in the table is in the CTR-ERR-001 registry with the listed retryable value.
2. Precise-location export cannot be created without the confirmation version (TEST-PS-078-02-01).
3. Token comparison timing test shows no statistically significant difference (ASSUMPTION threshold to be set in QA).

## Assumptions & open decisions
- ASSUMPTION: 10 min reauth window.
- PROVISIONAL (D05 default, unapproved): precise location leaves the system only on explicit user request.

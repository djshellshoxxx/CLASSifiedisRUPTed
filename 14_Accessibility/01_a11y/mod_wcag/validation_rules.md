# PS-111-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-02.R01 | Reject any `sc` value not in the pinned criteria list (`WCAG.CRITERION_UNKNOWN`). | MVP |
| PS-111-02.R02 | Reject a record with a criterion missing a result (`WCAG.RESULT_MISSING`). | MVP |
| PS-111-02.R03 | A `fail` result requires a linked finding; a `not_applicable` result requires `na_reason_key`. | MVP |

## Data / schema
Criteria list: versioned constant (ASSUMPTION: WCAG 2.1 A/AA, 50 entries).

## Commands / queries / events
Validation on `wcag.record.submit` and `wcag.finding.transition`.

## States & transitions
Not applicable.

## Validation & errors
| Rule | Code | Retryable | Message key |
|---|---|---|---|
| Unknown sc | WCAG.CRITERION_UNKNOWN | false | err.wcag.criterion_unknown |
| Missing result | WCAG.RESULT_MISSING | false | err.wcag.result_missing |
| Accepted risk past expiry | WCAG.ACCEPTANCE_EXPIRED | false | err.wcag.acceptance_expired |
| Stale revision | WCAG.STALE_REVISION | false | err.wcag.stale_revision |

Diagnostics contain sc and count only.

## Authorization
Validation applies to all submitters; see [PS-111-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
CI submission validated before upload.

## Privacy, retention, abuse
No user data in validation output.

## Observability & budgets
Counter per code.

## Tests
- TEST-PS-111-02-01 unit: 51 criteria with one removed fails with RESULT_MISSING.
- TEST-PS-111-02-02 unit: `fail` without finding link rejected.
- TEST-PS-111-02-03 unit: accepted-risk with expiry in the past rejected.

## Acceptance criteria
1. Each error returns the documented retryable value.
2. A record cannot be submitted with an incomplete criteria list.

## Assumptions & open decisions
- ASSUMPTION: criteria list pinned to WCAG 2.1.
- No Dxx decision directly affects validation.

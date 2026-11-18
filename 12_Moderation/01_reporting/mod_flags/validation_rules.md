# PS-094-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-02.R01 | Checks run in order: auth, restriction, schema, reason, target, self-report, dedupe, quota. First failure stops. | MVP |
| PS-094-02.R02 | `detail_text` ≤ 500 UTF-8 characters after NFC normalization; HTML and control characters stripped; longer → error, never truncated silently. | MVP |
| PS-094-02.R03 | A reporter may not report their own content or their own account (`FLG.SELF_REPORT_FORBIDDEN`). | MVP |
| PS-094-02.R04 | Target must exist and be readable by the reporter, otherwise `SYS.NOT_FOUND` (CTR-CAP-001). | MVP |
| PS-094-02.R05 | Reporting restricted accounts (set by mod_abuse) are refused with `FLG.REPORTING_RESTRICTED`. | MVP |
| PS-094-02.R06 | Reporter may withdraw only while status is `submitted` or `queued`. | MVP |

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FLG.REASON_INVALID | false | validation / 400 | reason_code not in enum. |
| FLG.DETAIL_TOO_LONG | false | validation / 400 | detail_text > 500 characters. |
| FLG.SELF_REPORT_FORBIDDEN | false | unprocessable_state / 422 | Target owned by reporter. |
| FLG.TARGET_NOT_REPORTABLE | false | unprocessable_state / 422 | Target type has no report path (e.g., draft visible only to owner). |
| FLG.REPORTING_RESTRICTED | false | forbidden / 403 | Reporter restricted by abuse controls. |
| FLG.WITHDRAW_NOT_ALLOWED | false | conflict / 409 | Withdraw after triage. |
| FLG.QUOTA_EXCEEDED | true | rate_limited / 429 | More than 20 submissions per reporter per 24 h (ASSUMPTION), with `retry_after_ms`. |

Detail: error responses never echo `detail_text` or target content (CTR-ERR-001 R07).

## Authorization
Caller must be authenticated `user` (`acc_`). Visibility of the target decides `SYS.NOT_FOUND` versus validation errors.

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic. Dedupe check happens after validation so that duplicates still get the `deduplicated` response even within quota.

## Privacy, retention, abuse
Validation logs record code and field path only. Reason and text are never logged. Repeated `FLG.SELF_REPORT_FORBIDDEN` or `FLG.REPORTING_RESTRICTED` responses feed mod_abuse.

## Observability & budgets
`flags_validation_rejections_total{code}`. Validation p95 ≤ 10 ms (ASSUMPTION).

## Tests
- TEST-PS-094-02-01 (unit): every code in the table reachable with its exact condition.
- TEST-PS-094-02-02 (boundary): 500 characters accepted, 501 rejected, combining marks counted after NFC.
- TEST-PS-094-02-03 (negative): self-report, unreadable target, restricted reporter.

## Acceptance criteria
1. Check order matches R01 for every rejection path (TEST-02 traces).
2. No error body contains reporter, target owner or detail text (TEST-CTR-ERR-001-04 fixture).

## Assumptions & open decisions
- ASSUMPTION: 20 submissions per 24 h per reporter; tuned by mod_limits.
- PROVISIONAL (D07 default, unapproved): detail text limit is a minimum-necessary choice.

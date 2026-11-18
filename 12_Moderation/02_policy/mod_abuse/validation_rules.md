# PS-095-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-02.R01 | Input text is normalized in this order: NFKC, lowercase, strip zero-width and bidi control characters, collapse whitespace. Rules match only normalized text. | MVP |
| PS-095-02.R02 | Scan covers up to 16 KiB of text per source. Longer input is scanned in 16 KiB windows with 256-byte overlap. | MVP |
| PS-095-02.R03 | A rule enters the registry only with two distinct approvers and a test fixture set (positive and negative). | MVP |
| PS-095-02.R04 | Rules with pattern_kind `token_set` must declare a max token distance and cannot match fewer than 2 tokens. | MVP |
| PS-095-02.R05 | Doxxing patterns (phone, email, street address shapes) match only in the content's author-visible region. | MVP |
| PS-095-02.R06 | A review decision must cite the same `rule_version` as the finding. | MVP |

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| ABU.RULE_INVALID | false | validation / 400 | Rule fails registry lint or lacks fixtures. |
| ABU.RULE_APPROVAL_MISSING | false | unprocessable_state / 422 | Fewer than two distinct approvers. |
| ABU.RULE_RETIRED | false | unprocessable_state / 422 | Review cites a retired rule_version. |
| ABU.FINDING_NOT_OPEN | false | conflict / 409 | Review of a non-open finding. |
| ABU.REVIEW_SELF_FORBIDDEN | false | forbidden / 403 | Reviewer is the subject. |
| ABU.INPUT_TRUNCATED | false | internal / 500 (metric only) | Window scan skipped; never returned to clients. |

## Authorization
Rule approvals require two `mod` principals with governance grant (`abuse.govern`), not reviewers of the same finding.

## Failure, idempotency, concurrency, offline
Validation is pure. Scans are deterministic for the same rule_version and input. Review uses `expected_revision`.

## Privacy, retention, abuse
Errors never echo rule patterns, matched text or input. Rule text is confidential (not published) to limit evasion; the registry ID and category are public.

## Observability & budgets
Scan p95 ≤ 20 ms per 16 KiB (ASSUMPTION); `abuse_rule_lint_failures_total`.

## Tests
- TEST-PS-095-02-01 (unit): normalization maps zero-width and NFKC variants to the same match.
- TEST-PS-095-02-02 (registry): rule without second approver rejected with ABU.RULE_APPROVAL_MISSING.
- TEST-PS-095-02-03 (window): match spanning window boundary detected via overlap.

## Acceptance criteria
1. Evasion fixtures (homoglyphs, zero-width, split tokens) detected at declared precision.
2. No error body contains pattern or matched text (CTR-ERR-001 R06).

## Assumptions & open decisions
- ASSUMPTION: 16 KiB window, 256-byte overlap.
- PROVISIONAL (D07 default, unapproved): rules store no user text.
- OPEN: language coverage for lexicon rules (Trust&Safety).
